import { ElasticsearchService } from './elasticsearch.service';
import { GuildsService } from '../guilds/guilds.service';
import { MessagesService } from '../messages/messages.service';
interface JwtPayload {
    userId: string;
}
export declare class SearchController {
    private readonly esService;
    private readonly guildsService;
    private readonly messagesService;
    private readonly logger;
    constructor(esService: ElasticsearchService, guildsService: GuildsService, messagesService: MessagesService);
    searchMessages(user: JwtPayload, query: string, guildId: string, channelId?: string, page?: string, limit?: string): Promise<import("./elasticsearch.service").SearchResult>;
    reindex(user: JwtPayload): Promise<{
        indexed: number;
        failed: number;
        total: number;
    }>;
}
export {};
