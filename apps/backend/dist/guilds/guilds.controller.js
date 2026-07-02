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
exports.GuildsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const guilds_service_1 = require("./guilds.service");
const create_guild_dto_1 = require("./dto/create-guild.dto");
const create_channel_dto_1 = require("./dto/create-channel.dto");
const create_category_dto_1 = require("./dto/create-category.dto");
const create_invite_dto_1 = require("./dto/create-invite.dto");
let GuildsController = class GuildsController {
    constructor(guildsService) {
        this.guildsService = guildsService;
    }
    createGuild(dto, user) {
        return this.guildsService.createGuild(dto.name, user.userId);
    }
    getMyGuilds(user) {
        return this.guildsService.findUserGuilds(user.userId);
    }
    joinByInvite(code, user) {
        return this.guildsService.joinByInvite(code, user.userId);
    }
    getGuild(guildId, user) {
        return this.guildsService.findGuildById(guildId, user.userId);
    }
    getMembers(guildId, user) {
        return this.guildsService.getMembers(guildId, user.userId);
    }
    createChannel(guildId, dto, user) {
        return this.guildsService.createChannel(guildId, user.userId, dto);
    }
    createCategory(guildId, dto, user) {
        return this.guildsService.createCategory(guildId, user.userId, dto.name);
    }
    createInvite(guildId, dto, user) {
        return this.guildsService.createInvite(guildId, user.userId, dto);
    }
    leaveGuild(guildId, user) {
        return this.guildsService.leaveGuild(guildId, user.userId);
    }
};
exports.GuildsController = GuildsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_guild_dto_1.CreateGuildDto, Object]),
    __metadata("design:returntype", void 0)
], GuildsController.prototype, "createGuild", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GuildsController.prototype, "getMyGuilds", null);
__decorate([
    (0, common_1.Post)('join/:code'),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GuildsController.prototype, "joinByInvite", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GuildsController.prototype, "getGuild", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GuildsController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Post)(':id/channels'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_channel_dto_1.CreateChannelDto, Object]),
    __metadata("design:returntype", void 0)
], GuildsController.prototype, "createChannel", null);
__decorate([
    (0, common_1.Post)(':id/categories'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_category_dto_1.CreateCategoryDto, Object]),
    __metadata("design:returntype", void 0)
], GuildsController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Post)(':id/invite'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_invite_dto_1.CreateInviteDto, Object]),
    __metadata("design:returntype", void 0)
], GuildsController.prototype, "createInvite", null);
__decorate([
    (0, common_1.Delete)(':id/leave'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GuildsController.prototype, "leaveGuild", null);
exports.GuildsController = GuildsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('guilds'),
    __metadata("design:paramtypes", [guilds_service_1.GuildsService])
], GuildsController);
//# sourceMappingURL=guilds.controller.js.map