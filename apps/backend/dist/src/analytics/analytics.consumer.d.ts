import { ClickHouseService } from './clickhouse.service';
export declare class AnalyticsConsumer {
    private chService;
    private readonly logger;
    constructor(chService: ClickHouseService);
    handleMessageCreated(message: {
        messageId: string;
        content: string;
        channelId: string;
        guildId: string;
        authorId: string;
        createdAt: string;
    }): Promise<void>;
}
