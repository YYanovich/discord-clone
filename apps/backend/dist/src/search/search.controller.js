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
exports.SearchController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const elasticsearch_service_1 = require("./elasticsearch.service");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const guilds_service_1 = require("../guilds/guilds.service");
const messages_service_1 = require("../messages/messages.service");
let SearchController = class SearchController {
    constructor(esService, guildsService, messagesService) {
        this.esService = esService;
        this.guildsService = guildsService;
        this.messagesService = messagesService;
        this.logger = new common_1.Logger('SearchController');
    }
    async searchMessages(user, query, guildId, channelId, page, limit) {
        this.logger.log(`Search request: q="${query}" guildId="${guildId}" userId="${user.userId}"`);
        if (!guildId) {
            return { hits: [], total: 0 };
        }
        await this.guildsService.assertMembership(guildId, user.userId);
        const result = await this.esService.search({
            query: query ?? '',
            guildId,
            channelId,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
        this.logger.log(`Search result: ${result.total} total hits`);
        return result;
    }
    async reindex(user) {
        this.logger.log(`Reindex triggered by user: ${user.userId}`);
        const messages = await this.messagesService.findAllWithGuild();
        this.logger.log(`Found ${messages.length} messages to index`);
        let indexed = 0;
        let failed = 0;
        for (const msg of messages) {
            try {
                await this.esService.indexMessage({
                    messageId: msg.id,
                    content: msg.content,
                    channelId: msg.channelId,
                    guildId: msg.channel?.guildId ?? '',
                    authorId: msg.authorId,
                    createdAt: msg.createdAt.toISOString(),
                });
                indexed++;
            }
            catch {
                failed++;
            }
        }
        return { indexed, failed, total: messages.length };
    }
};
exports.SearchController = SearchController;
__decorate([
    (0, common_1.Get)('messages'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('guildId')),
    __param(3, (0, common_1.Query)('channelId')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchMessages", null);
__decorate([
    (0, common_1.Post)('reindex'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "reindex", null);
exports.SearchController = SearchController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('search'),
    __metadata("design:paramtypes", [elasticsearch_service_1.ElasticsearchService,
        guilds_service_1.GuildsService,
        messages_service_1.MessagesService])
], SearchController);
//# sourceMappingURL=search.controller.js.map