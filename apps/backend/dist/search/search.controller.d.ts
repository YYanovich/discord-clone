import { ElasticsearchService, SearchResult } from './elasticsearch.service';
import { GuildsService } from '../guilds/guilds.service';
export declare class SearchController {
    private readonly esService;
    private readonly guildsService;
    constructor(esService: ElasticsearchService, guildsService: GuildsService);
    searchMessages(user: {
        userId: string;
    }, query: string, guildId: string, channelId?: string, authorId?: string, from?: string, to?: string, page?: string, limit?: string): Promise<SearchResult>;
}
