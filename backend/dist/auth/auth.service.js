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
const redis_service_1 = require("../common/redis/redis.service");
let AuthService = class AuthService {
    usersService;
    jwtService;
    redisService;
    constructor(usersService, jwtService, redisService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.redisService = redisService;
    }
    async register(dto) {
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing)
            throw new common_1.ConflictException('Email already taken');
        const passwordHash = await argon2_1.default.hash(dto.password, {
            type: argon2_1.default.argon2id,
        });
        const user = await this.usersService.create({
            email: dto.email,
            username: dto.username,
            passwordHash,
        });
        return { id: user.id, email: user.email };
    }
    async login(dto, userAgent, ip) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const valid = await argon2_1.default.verify(user.passwordHash, dto.password);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid credentionals');
        return this.issueTokens(user, userAgent, ip);
    }
    async issueTokens(user, userAgent, ip) {
        const sessionId = crypto_1.default.randomUUID();
        const accessToken = this.jwtService.sign({ sub: user.id, email: user.email, sessionId }, { expiresIn: '15m' });
        const refreshToken = crypto_1.default.randomBytes(40).toString('hex');
        const refreshHash = await argon2_1.default.hash(refreshToken, {
            type: argon2_1.default.argon2id,
        });
        await this.redisService.set(`refresh:${sessionId}`, JSON.stringify({ userId: user.id, hash: refreshHash }), 7 * 24 * 60 * 60);
        await this.usersService.createSession({
            userId: user.id,
            sessionId,
            refreshTokenHash: refreshHash,
            userAgent,
            ipAddress: ip,
        });
        return {
            accessToken,
            refreshToken,
            sessionId,
            user: { id: user.email, email: user.email, username: user.username },
        };
    }
    async refresh(refreshToken, sessionId) {
        const key = `refresh:${sessionId}`;
        const stored = await this.redisService.get(key);
        if (!stored)
            throw new common_1.UnauthorizedException('Session expired');
        const { userId, hash } = JSON.parse(stored);
        const valid = await argon2_1.default.verify(hash, refreshToken);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid refresh token');
        await this.redisService.del(key);
        const user = await this.usersService.findById(userId);
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        return this.issueTokens(user, '', '');
    }
    async logout(sessionId) {
        await this.redisService.del(`refresh:${sessionId}`);
        await this.usersService.deactivateSession(sessionId);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        redis_service_1.RedisService])
], AuthService);
//# sourceMappingURL=auth.service.js.map