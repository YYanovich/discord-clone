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
exports.ClickHouseService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@clickhouse/client");
let ClickHouseService = class ClickHouseService {
    constructor() {
        this.logger = new common_1.Logger('ClickHouseService');
        this.client = (0, client_1.createClient)({
            url: process.env.CLICKHOUSE_URL ?? 'http://localhost:8123',
            username: process.env.CLICKHOUSE_USER ?? 'default',
            password: process.env.CLICKHOUSE_PASSWORD ?? '',
            database: 'default',
        });
    }
    async onModuleInit() {
        await this.ensureSchema();
    }
    async ensureSchema() {
        try {
            const targetDb = process.env.CLICKHOUSE_DB ?? 'discord';
            await this.client.command({
                query: `CREATE DATABASE IF NOT EXISTS ${targetDb}`,
            });
            await this.client.command({
                query: `
          CREATE TABLE IF NOT EXISTS ${targetDb}.message_events (
            message_id    String,
            channel_id    String,
            guild_id      String,
            author_id     String,
            content_len   UInt32,
            created_at    DateTime64(3, 'UTC')
          ) ENGINE = ReplacingMergeTree()
          ORDER BY message_id
        `,
            });
            this.logger.log('ClickHouse schema initialized');
        }
        catch (err) {
            this.logger.error('Failed to init ClickHouse schema', err);
        }
    }
    async insertMessageEvent(data) {
        const targetDb = process.env.CLICKHOUSE_DB ?? 'discord';
        await this.client.insert({
            table: `${targetDb}.message_events`,
            values: [
                {
                    message_id: data.messageId,
                    channel_id: data.channelId,
                    author_id: data.authorId,
                    content_len: data.content.length,
                    created_at: data.createdAt,
                },
            ],
            format: 'JSONEachRow',
        });
    }
    async getChannelActivity(channelId, hours = 24) {
        const targetDb = process.env.CLICKHOUSE_DB ?? 'discord';
        const result = await this.client.query({
            query: `
        SELECT count() as cnt
        FROM ${targetDb}.message_events
        WHERE channel_id = {channelId: String}
          AND created_at >= now() - INTERVAL {hours: UInt32} HOUR
      `,
            query_params: { channelId, hours },
            format: 'JSONEachRow',
        });
        const rows = await result.json();
        return parseInt(rows[0]?.cnt ?? '0', 10);
    }
};
exports.ClickHouseService = ClickHouseService;
exports.ClickHouseService = ClickHouseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ClickHouseService);
//# sourceMappingURL=clickhouse.service.js.map