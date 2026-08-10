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
exports.MessagesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const messages_service_1 = require("./messages.service");
const events_gateway_1 = require("../events/events.gateway");
let MessagesController = class MessagesController {
    constructor(messagesService, eventsGateway) {
        this.messagesService = messagesService;
        this.eventsGateway = eventsGateway;
    }
    async edit(messageId, content, guildId, user) {
        await this.messagesService.edit(messageId, user.userId, content);
        if (guildId) {
            this.eventsGateway.emitToGuild(guildId, 'message:update', {
                id: messageId,
                content,
                editedAt: new Date().toISOString(),
            });
        }
        return { ok: true };
    }
    async delete(messageId, guildId, user) {
        await this.messagesService.softDelete(messageId, user.userId);
        if (guildId) {
            this.eventsGateway.emitToGuild(guildId, 'message:delete', {
                id: messageId,
            });
        }
        return { ok: true };
    }
};
exports.MessagesController = MessagesController;
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('content')),
    __param(2, (0, common_1.Body)('guildId')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "edit", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('guildId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "delete", null);
exports.MessagesController = MessagesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('messages'),
    __metadata("design:paramtypes", [messages_service_1.MessagesService,
        events_gateway_1.EventsGateway])
], MessagesController);
//# sourceMappingURL=messages.controller.js.map