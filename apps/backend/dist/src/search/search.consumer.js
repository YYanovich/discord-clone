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
    async handleMessageCreated(rawPayload) {
        try {
            let message = rawPayload;
            if (rawPayload &&
                typeof rawPayload === 'object' &&
                'value' in rawPayload) {
                message = rawPayload.value;
            }
            if (typeof message === 'string') {
                try {
                    message = JSON.parse(message);
                }
                catch (parseErr) {
                    this.logger.error('Failed to parse message payload JSON:', parseErr);
                    return;
                }
            }
            if (message && typeof message === 'object') {
                if ('data' in message && message.data) {
                    message =
                        typeof message.data === 'string'
                            ? JSON.parse(message.data)
                            : message.data;
                }
                else if ('payload' in message && message.payload) {
                    message =
                        typeof message.payload === 'string'
                            ? JSON.parse(message.payload)
                            : message.payload;
                }
            }
            const messageId = message?.messageId || message?.id;
            const guildId = message?.guildId;
            if (!guildId || !messageId) {
                this.logger.warn(`Message payload invalid (messageId=${messageId}, guildId=${guildId}) — skipping ES index\n` +
                    `DUMP: ${JSON.stringify(message)}`);
                return;
            }
            const messageDate = new Date(message.createdAt).getTime();
            if (!isNaN(messageDate)) {
                const age = Date.now() - messageDate;
                const ninetyDays = 90 * 24 * 60 * 60 * 1000;
                if (age > ninetyDays) {
                    this.logger.log(`Message ${messageId} is older than 90 days — skipping ES`);
                    return;
                }
            }
            await this.esService.indexMessage({
                messageId,
                guildId: message.guildId,
                content: message.content,
                channelId: message.channelId,
                authorId: message.authorId,
                createdAt: message.createdAt,
            });
            this.logger.log(`Indexed message ${messageId} in ES`);
        }
        catch (err) {
            this.logger.error(`Failed to index message:`, err);
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