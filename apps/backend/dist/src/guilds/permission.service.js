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
exports.PermissionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const guild_participant_entity_1 = require("./entities/guild-participant.entity");
const channel_participant_entity_1 = require("./entities/channel-participant.entity");
const participant_status_enum_1 = require("./entities/participant-status.enum");
let PermissionsService = class PermissionsService {
    constructor(dataSource, participantRepo) {
        this.dataSource = dataSource;
        this.participantRepo = participantRepo;
    }
    async checkGuildMembership(guildId, userId) {
        const participant = await this.participantRepo.findOne({
            where: {
                guildId,
                userId,
                status: participant_status_enum_1.ParticipantStatus.PARTICIPANT,
            },
        });
        if (!participant) {
            throw new common_1.ForbiddenException('Not a member of this guild');
        }
    }
    async hasPermission(userId, guildId, flag) {
        try {
            await this.checkGuildPermission(userId, guildId, flag);
            return true;
        }
        catch {
            return false;
        }
    }
    async checkGuildPermission(userId, guildId, flag) {
        const result = await this.dataSource.query(`
      SELECT gp.permissions, gp.status, g."ownerId" = $1 as is_owner
      FROM guild_participants gp
      JOIN guilds g ON g.id = gp."guildId"
      WHERE gp."guildId" = $2 AND gp."userId" = $1
    `, [userId, guildId]);
        if (!result[0])
            throw new common_1.ForbiddenException('Not a member');
        if (result[0].status !== participant_status_enum_1.ParticipantStatus.PARTICIPANT) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const isOwner = result[0].is_owner;
        const permissions = Number(result[0].permissions);
        const hasPermission = isOwner ||
            (permissions & guild_participant_entity_1.GuildPermission.ADMINISTRATOR) !== 0 ||
            (permissions & flag) !== 0;
        if (!hasPermission)
            throw new common_1.ForbiddenException('Insufficient permissions');
    }
    async checkChannelPermission(userId, channelId, flag) {
        const result = await this.dataSource.query(`
      SELECT
        g."ownerId" = $1 as is_owner,
        gp.permissions as guild_permissions,
        gp.status as guild_status,
        cp.permissions as channel_permissions
      FROM channels c
      JOIN guilds g ON g.id = c."guildId"
      JOIN guild_participants gp ON gp."guildId" = c."guildId" AND gp."userId" = $1
      LEFT JOIN channel_participants cp ON cp."channelId" = $2 AND cp."userId" = $1
      WHERE c.id = $2
    `, [userId, channelId]);
        if (!result[0])
            throw new common_1.ForbiddenException('Access denied');
        if (result[0].guild_status !== participant_status_enum_1.ParticipantStatus.PARTICIPANT) {
            throw new common_1.ForbiddenException('Access denied');
        }
        if (result[0].is_owner)
            return;
        const guildPerms = Number(result[0].guild_permissions);
        if ((guildPerms & guild_participant_entity_1.GuildPermission.ADMINISTRATOR) !== 0)
            return;
        const channelPerms = result[0].channel_permissions !== null
            ? Number(result[0].channel_permissions)
            : channel_participant_entity_1.ChannelPermission.READ | channel_participant_entity_1.ChannelPermission.WRITE;
        if ((channelPerms & flag) === 0) {
            throw new common_1.ForbiddenException('Insufficient channel permissions');
        }
    }
    async getMyGuildPermissions(userId, guildId) {
        const result = await this.dataSource.query(`
      SELECT gp.permissions, g."ownerId" = $1 as is_owner
      FROM guild_participants gp
      JOIN guilds g ON g.id = gp."guildId"
      WHERE gp."guildId" = $2 AND gp."userId" = $1
    `, [userId, guildId]);
        if (!result[0])
            return 0;
        if (result[0].is_owner)
            return ~0;
        return Number(result[0].permissions);
    }
};
exports.PermissionsService = PermissionsService;
exports.PermissionsService = PermissionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __param(1, (0, typeorm_1.InjectRepository)(guild_participant_entity_1.GuildParticipant)),
    __metadata("design:paramtypes", [Function, typeorm_2.Repository])
], PermissionsService);
//# sourceMappingURL=permission.service.js.map