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
exports.SearchConsumer = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const elasticsearch_service_1 = require("./elasticsearch.service");
let SearchConsumer = class SearchConsumer {
    constructor(esService) {
        this.esService = esService;
        this.logger = new common_1.Logger('SearchConsumer');
    }
    async handleMessageCreated(payload) {
        try {
            const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
            if (!data)
                return;
            const doc = {
                messageId: data.messageId || data.id,
                guildId: data.guildId,
                channelId: data.channelId,
                authorId: data.authorId || data.userId,
                content: data.content,
                createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
            };
            if (!doc.messageId || !doc.content) {
                this.logger.warn(`Skipping invalid payload structure: ${JSON.stringify(payload)}`);
                return;
            }
            await this.esService.indexMessage(doc);
            this.logger.log(`Successfully indexed message ${doc.messageId} to Elasticsearch`);
        }
        catch (err) {
            this.logger.error('Failed to index message in ES:', err);
        }
    }
};
exports.SearchConsumer = SearchConsumer;
__decorate([
    (0, microservices_1.EventPattern)('messages.created'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SearchConsumer.prototype, "handleMessageCreated", null);
exports.SearchConsumer = SearchConsumer = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [elasticsearch_service_1.ElasticsearchService])
], SearchConsumer);
//# sourceMappingURL=search.consumer.js.map