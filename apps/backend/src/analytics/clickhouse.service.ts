import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@clickhouse/client';
import type { ClickHouseClient } from '@clickhouse/client';

@Injectable()
export class ClickHouseService implements OnModuleInit {
  private readonly logger = new Logger('ClickHouseService');
  private client: ClickHouseClient;

  constructor(private readonly configService: ConfigService) {
    this.client = createClient({
      url: this.configService.get<string>(
        'CLICKHOUSE_URL',
        'http://localhost:8123',
      ),
      username: this.configService.get<string>('CLICKHOUSE_USER', 'discord'),
      password: this.configService.get<string>('CLICKHOUSE_PASSWORD', 'secret'),
      database: 'discord',
    });
  }

  async onModuleInit() {
    await this.ensureSchema();
  }

  private async ensureSchema(): Promise<void> {
    try {
      await this.client.command({
        query: 'CREATE DATABASE IF NOT EXISTS discord',
      });

      //activity by hours
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

      //author activity by days
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

      //save events for detail analytic
      //save only metadata, not text
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
    } catch (err) {
      this.logger.error('Failed to init ClickHouse schema:', err);
    }
  }

  //note event
  async insertMessageEvent(data: {
    messageId: string;
    channelId: string;
    guildId: string;
    authorId: string;
    content: string;
    createdAt: string;
  }): Promise<void> {
    const msgLen = data.content.length;
    const hour = new Date(data.createdAt);
    hour.setMinutes(0, 0, 0);

    const date = data.createdAt.split('T')[0];

    await Promise.all([
      //event
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

      //channel activity by hours
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

      //author activity by days
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

  //channel ativity for the last N hours, for graph
  async getChannelActivity(
    channelId: string,
    hours = 24,
  ): Promise<
    Array<{
      hour: string;
      messageCount: number;
      uniqueAuthors: number;
    }>
  > {
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
    const rows = await result.json<{
      hour: string;
      message_count: string;
      unique_authors: string;
    }>();
    return rows.map((r) => ({
      hour: r.hour,
      messageCount: parseInt(r.message_count, 10),
      uniqueAuthors: parseInt(r.unique_authors, 10),
    }));
  }

  //the most active authors for N days
  async getTopAuthors(
    guildId: string,
    days = 7,
    limit = 10,
  ): Promise<
    Array<{
      authorId: string;
      messageCount: number;
      totalChars: number;
    }>
  > {
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
    const rows = await result.json<{
      author_id: string;
      message_count: string;
      total_chars: string;
    }>();
    return rows.map((r) => ({
      authorId: r.author_id,
      messageCount: parseInt(r.message_count, 10),
      totalChars: parseInt(r.total_chars, 10),
    }));
  }

  //peak hours activity for hours and days in a week
  async getGuildPeakHours(guildId: string): Promise<
    Array<{
      hourOfDay: number;
      avgMessages: number;
    }>
  > {
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
    const rows = await result.json<{
      hour_of_day: string;
      avg_messages: string;
    }>();
    return rows.map((r) => ({
      hourOfDay: parseInt(r.hour_of_day, 10),
      avgMessages: parseFloat(r.avg_messages),
    }));
  }

  async insertVoiceEvent(data: {
    eventId: string;
    guildId: string;
    channelId: string;
    userId: string;
    eventType: 'join' | 'leave' | 'mute' | 'unmute' | 'deafen' | 'undeafen';
    durationSeconds?: number;
    createdAt: string;
  }): Promise<void> {
    await this.client.insert({
      table: 'discord.message_events',
      values: [
        {
          event_id: data.eventId,
          guild_id: data.guildId,
          channel_id: data.channelId,
          author_id: data.userId,
          msg_len: data.durationSeconds ?? 0,
          created_at: data.createdAt,
        },
      ],
      format: 'JSONEachRow',
    });
  }
}
