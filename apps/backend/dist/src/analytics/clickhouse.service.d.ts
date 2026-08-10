import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class ClickHouseService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private client;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    private ensureSchema;
    insertMessageEvent(data: {
        messageId: string;
        channelId: string;
        guildId: string;
        authorId: string;
        content: string;
        createdAt: string;
    }): Promise<void>;
    getChannelActivity(channelId: string, hours?: number): Promise<Array<{
        hour: string;
        messageCount: number;
        uniqueAuthors: number;
    }>>;
    getTopAuthors(guildId: string, days?: number, limit?: number): Promise<Array<{
        authorId: string;
        messageCount: number;
        totalChars: number;
    }>>;
    getGuildPeakHours(guildId: string): Promise<Array<{
        hourOfDay: number;
        avgMessages: number;
    }>>;
}
