"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const guild_entity_1 = require("./entities/guild.entity");
const category_entity_1 = require("./entities/category.entity");
const channel_entity_1 = require("./entities/channel.entity");
const membership_entity_1 = require("./entities/membership.entity");
const invite_entity_1 = require("./entities/invite.entity");
const crypto = __importStar(require("crypto"));
let GuildsService = class GuildsService {
    constructor(guildRepo, categoryRepo, channelRepo, membershipRepo, inviteRepo) {
        this.guildRepo = guildRepo;
        this.categoryRepo = categoryRepo;
        this.channelRepo = channelRepo;
        this.membershipRepo = membershipRepo;
        this.inviteRepo = inviteRepo;
    }
    async createGuild(name, ownerId) {
        const guild = this.guildRepo.create({ name, ownerId });
        const saved = await this.guildRepo.save(guild);
        const membership = this.membershipRepo.create({
            userId: ownerId,
            guildId: saved.id,
        });
        await this.membershipRepo.save(membership);
        const defaultChannel = this.channelRepo.create({
            name: 'general',
            type: channel_entity_1.ChannelType.TEXT,
            guildId: saved.id,
            categoryId: null,
        });
        await this.channelRepo.save(defaultChannel);
        return saved;
    }
    async findUserGuilds(userId) {
        const membership = await this.membershipRepo.find({
            where: { userId },
            relations: { guild: true },
        });
        return membership.map((m) => m.guild);
    }
    async findGuildById(guildId, userId) {
        await this.assertMembership(guildId, userId);
        const guild = await this.guildRepo.findOne({
            where: { id: guildId },
            relations: { categories: true, channels: true },
        });
        if (!guild)
            throw new common_1.NotFoundException('Guild not found');
        return guild;
    }
    async createChannel(guildId, userId, dto) {
        const guild = await this.assertOwnership(guildId, userId);
        const channel = this.channelRepo.create({
            name: dto.name,
            type: dto.type,
            guildId: guild.id,
            categoryId: dto.categoryId ?? null,
        });
        return this.channelRepo.save(channel);
    }
    async createCategory(guildId, userId, name) {
        const guild = await this.assertOwnership(guildId, userId);
        const category = this.categoryRepo.create({
            name,
            guildId: guild.id,
        });
        return this.categoryRepo.save(category);
    }
    async createInvite(guildId, userId, dto = {}) {
        await this.assertMembership(guildId, userId);
        const code = crypto.randomBytes(4).toString('hex');
        const expiresAt = dto.expiresInHours
            ? new Date(Date.now() + dto.expiresInHours * 60 * 60 * 1000)
            : null;
        const invite = this.inviteRepo.create({
            code,
            guildId,
            createdById: userId,
            maxUses: dto.maxUses ?? null,
            uses: 0,
            expiresAt,
        });
        return this.inviteRepo.save(invite);
    }
    async joinByInvite(code, userId) {
        const invite = await this.inviteRepo.findOne({
            where: { code },
            relations: { guild: true },
        });
        if (!invite)
            throw new common_1.NotFoundException('Invalid invite code');
        if (invite.expiresAt && new Date() > invite.expiresAt) {
            throw new common_1.ForbiddenException('Invite link has expired');
        }
        if (invite.maxUses !== null && invite.uses >= invite.maxUses) {
            throw new common_1.ForbiddenException('Invite link has reached its maximum uses');
        }
        await this.joinGuild(invite.guildId, userId);
        await this.inviteRepo.update({ id: invite.id }, { uses: invite.uses + 1 });
    }
    async joinGuild(guildId, userId) {
        const guild = await this.guildRepo.findOne({ where: { id: guildId } });
        if (!guild)
            throw new common_1.NotFoundException('Guild not found');
        const existing = await this.membershipRepo.findOne({
            where: { guildId, userId },
        });
        if (existing)
            return;
        const membership = this.membershipRepo.create({ userId, guildId });
        await this.membershipRepo.save(membership);
    }
    async leaveGuild(guildId, userId) {
        const guild = await this.guildRepo.findOne({ where: { id: guildId } });
        if (!guild)
            throw new common_1.NotFoundException('Guild not found');
        if (guild.ownerId === userId) {
            throw new common_1.ForbiddenException('Owner cannot leave the guild. Delete it instead.');
        }
        await this.membershipRepo.delete({ guildId, userId });
    }
    async getMembers(guildId, userId) {
        await this.assertMembership(guildId, userId);
        return this.membershipRepo.find({
            where: { guildId },
            relations: { user: true },
            select: {
                id: true,
                joinedAt: true,
                user: {
                    id: true,
                    username: true,
                },
            },
        });
    }
    async assertMembership(guildId, userId) {
        const membership = await this.membershipRepo.findOne({
            where: { guildId, userId },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('You are not a member of this guild');
        }
    }
    async assertOwnership(guildId, userId) {
        const guild = await this.guildRepo.findOne({ where: { id: guildId } });
        if (!guild)
            throw new common_1.NotFoundException('Guild not found');
        if (guild.ownerId !== userId) {
            throw new common_1.ForbiddenException('Only the owner can perform this action');
        }
        return guild;
    }
};
exports.GuildsService = GuildsService;
exports.GuildsService = GuildsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(guild_entity_1.Guild)),
    __param(1, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __param(2, (0, typeorm_1.InjectRepository)(channel_entity_1.Channel)),
    __param(3, (0, typeorm_1.InjectRepository)(membership_entity_1.Membership)),
    __param(4, (0, typeorm_1.InjectRepository)(invite_entity_1.Invite)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], GuildsService);
//# sourceMappingURL=guilds.service.js.map