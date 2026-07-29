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
const role_entity_1 = require("./entities/role.entity");
const member_role_entity_1 = require("./entities/member-role.entity");
const channel_overwrite_entity_1 = require("./entities/channel-overwrite.entity");
const guild_entity_1 = require("./entities/guild.entity");
let PermissionsService = class PermissionsService {
    constructor(roleRepo, memberRoleRepo, overwriteRepo, guildRepo) {
        this.roleRepo = roleRepo;
        this.memberRoleRepo = memberRoleRepo;
        this.overwriteRepo = overwriteRepo;
        this.guildRepo = guildRepo;
    }
    async computePermissions(userId, guildId, channelId) {
        const guild = await this.guildRepo.findOne({ where: { id: guildId } });
        if (guild?.ownerId === userId)
            return ~0;
        const everyoneRole = await this.roleRepo.findOne({
            where: { guildId, name: '@everyone' },
        });
        const memberRoles = await this.memberRoleRepo.find({
            where: { userId, guildId },
            relations: {
                role: true,
            },
            order: { role: { position: 'DESC' } },
        });
        let permissions = everyoneRole?.permissions ?? 0;
        for (const mr of memberRoles) {
            permissions |= mr.role.permissions;
        }
        if (permissions & role_entity_1.PermissionFlag.ADMINISTRATOR)
            return ~0;
        if (channelId) {
            const overwrites = await this.overwriteRepo.find({
                where: { channelId },
            });
            if (everyoneRole) {
                const everyoneOverwrite = overwrites.find((o) => o.roleId === everyoneRole.id);
                if (everyoneOverwrite) {
                    permissions &= ~everyoneOverwrite.deny;
                    permissions |= everyoneOverwrite.allow;
                }
            }
            for (const mr of memberRoles) {
                const overwrite = overwrites.find((o) => o.roleId === mr.roleId);
                if (overwrite) {
                    permissions &= ~overwrite.deny;
                    permissions |= overwrite.allow;
                }
            }
            const userOverwrite = overwrites.find((o) => o.userId === userId);
            if (userOverwrite) {
                permissions &= ~userOverwrite.deny;
                permissions |= userOverwrite.allow;
            }
        }
        return permissions;
    }
    async hasPermission(userId, guildId, flag, channelId) {
        const permissions = await this.computePermissions(userId, guildId, channelId);
        return (permissions & flag) === flag;
    }
};
exports.PermissionsService = PermissionsService;
exports.PermissionsService = PermissionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(1, (0, typeorm_1.InjectRepository)(member_role_entity_1.MemberRole)),
    __param(2, (0, typeorm_1.InjectRepository)(channel_overwrite_entity_1.ChannelOverwrite)),
    __param(3, (0, typeorm_1.InjectRepository)(guild_entity_1.Guild)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PermissionsService);
//# sourceMappingURL=permission.service.js.map