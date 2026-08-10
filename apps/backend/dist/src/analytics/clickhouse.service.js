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
const config_1 = require("@nestjs/config");
const client_1 = require("@clickhouse/client");
let ClickHouseService = class ClickHouseService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger('ClickHouseService');
        this.client = (0, client_1.createClient)({
            url: this.configService.get('CLICKHOUSE_URL', 'http://localhost:8123'),
            username: this.configService.get('CLICKHOUSE_USER', 'discord'),
            password: this.configService.get('CLICKHOUSE_PASSWORD', 'secret'),
            database: 'discord',
        });
    }
    async onModuleInit() {
        await this.ensureSchema();
    }
    async ensureSchema() {
        try {
            await this.client.command({
                query: 'CREATE DATABASE IF NOT EXISTS discord',
            });
            await this.client.command({
                query: `
        CREATE TABLE IF NOT EXISTS discord.channel_hourly_stats (
          guild_id      String,
          channel_id    String,
          hour          DateTime,
          message_count UInt32,
          unique_authors UInt32,
          avg_msg_len   Float32,
          total_chars   UInt64
        ) ENGINE = SummingMergeTree((message_count, unique_authors, total_chars))
        ORDER BY (guild_id, channel_id, hour)
        PARTITION BY toYYYYMM(hour)
      `,
            });
            await this.client.command({
                query: `
        CREATE TABLE IF NOT EXISTS discord.author_daily_stats (
          guild_id        String,
          author_id       String,
          date            Date,
          message_count   UInt32,
          channels_active UInt32,
          total_chars     UInt64
        ) ENGINE = SummingMergeTree((message_count, channels_active, total_chars))
        ORDER BY (guild_id, author_id, date)
        PARTITION BY toYYYYMM(date)
      `,
            });
            await this.client.command({
                query: `
        CREATE TABLE IF NOT EXISTS discord.message_events (
          event_id    String,
          guild_id    String,
          channel_id  String,
          author_id   String,
          msg_len     UInt32,
          created_at  DateTime64(3, 'UTC')
        ) ENGINE = ReplacingMergeTree()
        ORDER BY event_id
        PARTITION BY toYYYYMM(created_at)
        TTL toDateTime(created_at) + INTERVAL 90 DAY  -- automatic delete older than 90 days
      `,
            });
            this.logger.log('ClickHouse schema initialized');
        }
        catch (err) {
            this.logger.error('Failed to init ClickHouse schema:', err);
        }
    }
    async insertMessageEvent(data) {
        const msgLen = data.content.length;
        const hour = new Date(data.createdAt);
        hour.setMinutes(0, 0, 0);
        const date = data.createdAt.split('T')[0];
        await Promise.all([
            this.client.insert({
                table: 'discord.message_events',
                values: [
                    {
                        event_id: data.messageId,
                        guild_id: data.guildId,
                        channel_id: data.channelId,
                        author_id: data.authorId,
                        msg_len: msgLen,
                        created_at: data.createdAt,
                    },
                ],
                format: 'JSONEachRow',
            }),
            this.client.insert({
                table: 'discord.channel_hourly_stats',
                values: [
                    {
                        guild_id: data.guildId,
                        channel_id: data.channelId,
                        hour: hour.toISOString(),
                        message_count: 1,
                        unique_authors: 1,
                        avg_msg_len: msgLen,
                        total_chars: msgLen,
                    },
                ],
                format: 'JSONEachRow',
            }),
            this.client.insert({
                table: 'discord.author_daily_stats',
                values: [
                    {
                        guild_id: data.guildId,
                        author_id: data.authorId,
                        date: date,
                        message_count: 1,
                        channels_active: 1,
                        total_chars: msgLen,
                    },
                ],
                format: 'JSONEachRow',
            }),
        ]);
    }
    async getChannelActivity(channelId, hours = 24) {
        const result = await this.client.query({
            query: `
        SELECT
          formatDateTime(hour, '%Y-%m-%dT%H:00:00Z') as hour,
          sum(message_count) as message_count,
          count(distinct author_id) as unique_authors
        FROM discord.message_events
        WHERE channel_id = {channelId: String}
          AND created_at >= now() - INTERVAL {hours: UInt32} HOUR
        GROUP BY toStartOfHour(created_at) as hour
        ORDER BY hour ASC
      `,
            query_params: { channelId, hours },
            format: 'JSONEachRow',
        });
        const rows = await result.json();
        return rows.map((r) => ({
            hour: r.hour,
            messageCount: parseInt(r.message_count, 10),
            uniqueAuthors: parseInt(r.unique_authors, 10),
        }));
    }
    async getTopAuthors(guildId, days = 7, limit = 10) {
        const result = await this.client.query({
            query: `
        SELECT
          author_id,
          sum(message_count) as message_count,
          sum(total_chars) as total_chars
        FROM discord.author_daily_stats
        WHERE guild_id = {guildId: String}
          AND date >= today() - {days: UInt32}
        GROUP BY author_id
        ORDER BY message_count DESC
        LIMIT {limit: UInt32}
      `,
            query_params: { guildId, days, limit },
            format: 'JSONEachRow',
        });
        const rows = await result.json();
        return rows.map((r) => ({
            authorId: r.author_id,
            messageCount: parseInt(r.message_count, 10),
            totalChars: parseInt(r.total_chars, 10),
        }));
    }
    async getGuildPeakHours(guildId) {
        const result = await this.client.query({
            query: `
        SELECT
          toHour(created_at) as hour_of_day,
          avg(cnt) as avg_messages
        FROM (
          SELECT
            toStartOfHour(created_at) as h,
            toHour(created_at) as hour_of_day_inner,
            count() as cnt
          FROM discord.message_events
          WHERE guild_id = {guildId: String}
            AND created_at >= now() - INTERVAL 30 DAY
          GROUP BY h, hour_of_day_inner
        )
        GROUP BY hour_of_day
        ORDER BY hour_of_day ASC
      `,
            query_params: { guildId },
            format: 'JSONEachRow',
        });
        const rows = await result.json();
        return rows.map((r) => ({
            hourOfDay: parseInt(r.hour_of_day, 10),
            avgMessages: parseFloat(r.avg_messages),
        }));
    }
};
exports.ClickHouseService = ClickHouseService;
exports.ClickHouseService = ClickHouseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ClickHouseService);
//# sourceMappingURL=clickhouse.service.js.map