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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const session_entity_1 = require("./entities/session.entity");
let UsersService = class UsersService {
    constructor(userRepo, sessionRepo) {
        this.userRepo = userRepo;
        this.sessionRepo = sessionRepo;
    }
    async findByEmail(email) {
        return this.userRepo.findOne({
            where: { email },
            select: {
                id: true,
                email: true,
                username: true,
                passwordHash: true,
            },
        });
    }
    async findById(id) {
        return this.userRepo.findOne({ where: { id } });
    }
    async create(data) {
        const existingUsername = await this.userRepo.findOne({
            where: { username: data.username },
        });
        if (existingUsername) {
            throw new Error('USERNAME_TAKEN');
        }
        const user = this.userRepo.create(data);
        return this.userRepo.save(user);
    }
    async createSession(data) {
        const user = await this.findById(data.userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const session = this.sessionRepo.create({
            id: data.sessionId,
            user: user,
            refreshTokenHash: data.refreshTokenHash,
            fingerprint: data.fingerprint,
            userAgent: data.userAgent,
            ipAddress: data.ipAddress,
            country: data.country ?? null,
            city: data.city ?? null,
            expiresAt,
        });
        await this.sessionRepo.save(session);
    }
    async findActiveSession(sessionId) {
        if (!sessionId) {
            return null;
        }
        return this.sessionRepo.findOne({
            where: { id: sessionId, isActive: true },
            relations: {
                user: true,
            },
        });
    }
    async updateSessionRefreshToken(sessionId, refreshTokenHash) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await this.sessionRepo.update({ id: sessionId }, {
            refreshTokenHash,
            expiresAt,
            lastActiveAt: new Date(),
        });
    }
    async deactivateSession(sessionId) {
        await this.sessionRepo.update({ id: sessionId }, { isActive: false, refreshTokenHash: null });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(session_entity_1.Session)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map