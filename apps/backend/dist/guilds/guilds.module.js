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
const guilds_service_1 = require("./guilds.service");
const guilds_controller_1 = require("./guilds.controller");
const guild_entity_1 = require("./entities/guild.entity");
const category_entity_1 = require("./entities/category.entity");
const channel_entity_1 = require("./entities/channel.entity");
const membership_entity_1 = require("./entities/membership.entity");
const invite_entity_1 = require("./entities/invite.entity");
let GuildsModule = class GuildsModule {
};
exports.GuildsModule = GuildsModule;
exports.GuildsModule = GuildsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([guild_entity_1.Guild, category_entity_1.Category, channel_entity_1.Channel, membership_entity_1.Membership, invite_entity_1.Invite]),
        ],
        providers: [guilds_service_1.GuildsService],
        controllers: [guilds_controller_1.GuildsController],
        exports: [guilds_service_1.GuildsService],
    })
], GuildsModule);
//# sourceMappingURL=guilds.module.js.map