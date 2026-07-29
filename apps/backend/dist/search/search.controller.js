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
let SearchController = class SearchController {
    constructor(esService, guildsService) {
        this.esService = esService;
        this.guildsService = guildsService;
    }
    async searchMessages(user, query, guildId, channelId, authorId, from, to, page, limit) {
        if (!guildId) {
            throw new common_1.BadRequestException('guildId is required');
        }
        await this.guildsService.assertMembership(guildId, user.userId);
        return this.esService.search({
            query,
            guildId,
            channelId,
            authorId,
            from,
            to,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
        });
    }
};
exports.SearchController = SearchController;
__decorate([
    (0, common_1.Get)('messages'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('guildId')),
    __param(3, (0, common_1.Query)('channelId')),
    __param(4, (0, common_1.Query)('authorId')),
    __param(5, (0, common_1.Query)('from')),
    __param(6, (0, common_1.Query)('to')),
    __param(7, (0, common_1.Query)('page')),
    __param(8, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchMessages", null);
exports.SearchController = SearchController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('search'),
    __metadata("design:paramtypes", [elasticsearch_service_1.ElasticsearchService,
        guilds_service_1.GuildsService])
], SearchController);
//# sourceMappingURL=search.controller.js.map