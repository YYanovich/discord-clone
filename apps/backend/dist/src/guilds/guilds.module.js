"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const guild_entity_1 = require("./entities/guild.entity");
const category_entity_1 = require("./entities/category.entity");
const channel_entity_1 = require("./entities/channel.entity");
const invite_entity_1 = require("./entities/invite.entity");
const guild_participant_entity_1 = require("./entities/guild-participant.entity");
const channel_participant_entity_1 = require("./entities/channel-participant.entity");
const guilds_service_1 = require("./guilds.service");
const guilds_controller_1 = require("./guilds.controller");
const permission_service_1 = require("./permission.service");
let GuildsModule = class GuildsModule {
};
exports.GuildsModule = GuildsModule;
exports.GuildsModule = GuildsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                guild_entity_1.Guild,
                channel_entity_1.Channel,
                category_entity_1.Category,
                invite_entity_1.Invite,
                guild_participant_entity_1.GuildParticipant,
                channel_participant_entity_1.ChannelParticipant,
            ]),
        ],
        controllers: [guilds_controller_1.GuildsController],
        providers: [guilds_service_1.GuildsService, permission_service_1.PermissionsService],
        exports: [guilds_service_1.GuildsService, permission_service_1.PermissionsService],
    })
], GuildsModule);
//# sourceMappingURL=guilds.module.js.map