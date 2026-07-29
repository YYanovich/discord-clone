import { ElasticsearchService } from './elasticsearch.service';
export declare class SearchConsumer {
    private esService;
    private readonly logger;
    constructor(esService: ElasticsearchService);
    handleMessageCreated(message: {
        messageId: string;
        content: string;
        channelId: string;
        guildId: string;
        authorId: string;
        createdAt: string;
    }): Promise<void>;
}
