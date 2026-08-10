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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElasticsearchService = void 0;
const common_1 = require("@nestjs/common");
const elasticsearch_1 = require("@elastic/elasticsearch");
let ElasticsearchService = class ElasticsearchService {
    constructor() {
        this.logger = new common_1.Logger('ElasticsearchService');
        this.client = new elasticsearch_1.Client({
            node: process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200',
        });
    }
    async onModuleInit() {
        await this.ensureIndex();
    }
    async ensureIndex() {
        try {
            const exists = await this.client.indices.exists({ index: 'messages' });
            if (!exists) {
                await this.client.indices.create({
                    index: 'messages',
                    mappings: {
                        properties: {
                            messageId: { type: 'keyword' },
                            content: { type: 'text', analyzer: 'standard' },
                            channelId: { type: 'keyword' },
                            guildId: { type: 'keyword' },
                            authorId: { type: 'keyword' },
                            createdAt: { type: 'date' },
                        },
                    },
                });
                this.logger.log('Created messages index in Elasticsearch');
            }
        }
        catch (err) {
            this.logger.error('Failed to create ES index:', err);
        }
    }
    async indexMessage(doc) {
        await this.client.index({
            index: 'messages',
            id: doc.messageId,
            document: doc,
            refresh: true,
        });
    }
    async search(params) {
        const must = [
            {
                bool: {
                    should: [
                        {
                            match_phrase_prefix: {
                                content: {
                                    query: params.query,
                                },
                            },
                        },
                        {
                            match: {
                                content: {
                                    query: params.query,
                                    fuzziness: 'AUTO',
                                },
                            },
                        },
                    ],
                },
            },
        ];
        const filter = [];
        if (params.channelId) {
            filter.push({ term: { channelId: params.channelId } });
        }
        if (params.authorId) {
            filter.push({ term: { authorId: params.authorId } });
        }
        if (params.guildId) {
            filter.push({ term: { guildId: params.guildId } });
        }
        if (params.from || params.to) {
            filter.push({
                range: {
                    createdAt: {
                        ...(params.from && { gte: params.from }),
                        ...(params.to && { lte: params.to }),
                    },
                },
            });
        }
        const result = await this.client.search({
            index: 'messages',
            from: ((Number(params.page) || 1) - 1) * (Number(params.limit) || 20),
            size: Number(params.limit) || 20,
            query: { bool: { must, filter } },
            sort: [{ createdAt: { order: 'desc' } }],
            highlight: {
                fields: { content: {} },
            },
        });
        const hits = result.hits.hits.map((hit) => ({
            ...hit._source,
            highlight: hit.highlight?.content?.[0],
        }));
        const total = typeof result.hits.total === 'number'
            ? result.hits.total
            : (result.hits.total?.value ?? 0);
        return { hits, total };
    }
};
exports.ElasticsearchService = ElasticsearchService;
exports.ElasticsearchService = ElasticsearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ElasticsearchService);
//# sourceMappingURL=elasticsearch.service.js.map