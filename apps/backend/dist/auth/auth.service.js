"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const argon2_1 = __importDefault(require("argon2"));
const crypto_1 = __importDefault(require("crypto"));
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    constructor(usersService, jwtService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    async register(dto) {
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing) {
            throw new common_1.ConflictException('Email already taken');
        }
        let passwordHash;
        try {
            passwordHash = await argon2_1.default.hash(dto.password, {
                type: argon2_1.default.argon2id,
            });
        }
        catch (argonError) {
            console.error('Argon2 hashing failed:', argonError);
            throw new common_1.InternalServerErrorException('Registration failed due to a security error');
        }
        try {
            await this.usersService.create({
                email: dto.email,
                username: dto.username,
                passwordHash,
            });
        }
        catch (err) {
            if (err instanceof Error && err.message === 'USERNAME_TAKEN') {
                throw new common_1.ConflictException('Username already taken');
            }
            throw new common_1.InternalServerErrorException('Database error during registration');
        }
        return {
            success: true,
            message: 'User has been registered successfully.',
        };
    }
    async login(dto, fingerprint, ipAddress, userAgent) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const valid = await argon2_1.default.verify(user.passwordHash, dto.password);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid credentionals');
        return this.issueTokens(user, fingerprint, ipAddress, userAgent);
    }
    async issueTokens(user, fingerprint, ipAddress, userAgent) {
        const sessionId = crypto_1.default.randomUUID();
        const accessToken = this.jwtService.sign({ sub: user.id, email: user.email, sessionId, fingerprint }, { expiresIn: '15m' });
        const refreshToken = crypto_1.default.randomBytes(40).toString('hex');
        const refreshHash = await argon2_1.default.hash(refreshToken, {
            type: argon2_1.default.argon2id,
        });
        await this.usersService.createSession({
            sessionId,
            userId: user.id,
            refreshTokenHash: refreshHash,
            fingerprint,
            ipAddress,
            userAgent,
        });
        return {
            accessToken,
            refreshToken,
            sessionId,
            user: { id: user.id, email: user.email, username: user.username },
        };
    }
    async refresh(refreshToken, sessionId, fingerprint) {
        const session = await this.usersService.findActiveSession(sessionId);
        if (!session) {
            throw new common_1.UnauthorizedException('Session expired');
        }
        if (new Date() > session.expiresAt) {
            await this.usersService.deactivateSession(sessionId);
            throw new common_1.UnauthorizedException('Session expired');
        }
        if (session.fingerprint !== fingerprint) {
            await this.usersService.deactivateSession(sessionId);
            throw new common_1.UnauthorizedException('Invalid device');
        }
        const valid = await argon2_1.default.verify(session.refreshTokenHash, refreshToken);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid refresh token');
        const newRefreshToken = crypto_1.default.randomBytes(40).toString('hex');
        const newRefreshHash = await argon2_1.default.hash(newRefreshToken, {
            type: argon2_1.default.argon2id,
        });
        await this.usersService.updateSessionRefreshToken(sessionId, newRefreshHash);
        const accessToken = this.jwtService.sign({
            sub: session.user.id,
            email: session.user.email,
            sessionId,
            fingerprint,
        }, { expiresIn: '15m' });
        return {
            accessToken,
            refreshToken: newRefreshToken,
            sessionId,
            user: {
                id: session.user.id,
                email: session.user.email,
                username: session.user.username,
            },
        };
    }
    async logout(sessionId) {
        await this.usersService.deactivateSession(sessionId);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map