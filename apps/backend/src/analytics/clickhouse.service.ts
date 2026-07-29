import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { createClient, ClickHouseClient } from '@clickhouse/client';

@Injectable()
export class ClickHouseService implements OnModuleInit {
  private readonly logger = new Logger('ClickHouseService');
  private client: ClickHouseClient;

  constructor() {
    this.client = createClient({
      url: process.env.CLICKHOUSE_URL ?? 'http://localhost:8123',
      username: process.env.CLICKHOUSE_USER ?? 'default',
      password: process.env.CLICKHOUSE_PASSWORD ?? '',
      database: 'default',
    });
  }

  async onModuleInit() {
    await this.ensureSchema();
  }

  private async ensureSchema(): Promise<void> {
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
    } catch (err) {
      this.logger.error('Failed to init ClickHouse schema', err);
    }
  }

  async insertMessageEvent(data: {
    messageId: string;
    channelId: string;
    authorId: string;
    content: string;
    createdAt: string;
  }): Promise<void> {
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

  async getChannelActivity(channelId: string, hours = 24): Promise<number> {
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

    const rows = await result.json<{ cnt: string }>();
    return parseInt(rows[0]?.cnt ?? '0', 10);
  }
}
