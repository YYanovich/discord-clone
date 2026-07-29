import { OnModuleInit } from '@nestjs/common';
export declare class ClickHouseService implements OnModuleInit {
    private readonly logger;
    private client;
    constructor();
    onModuleInit(): Promise<void>;
    private ensureSchema;
    insertMessageEvent(data: {
        messageId: string;
        channelId: string;
        authorId: string;
        content: string;
        createdAt: string;
    }): Promise<void>;
    getChannelActivity(channelId: string, hours?: number): Promise<number>;
}
