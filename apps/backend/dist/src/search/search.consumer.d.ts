import { ElasticsearchService } from './elasticsearch.service';
export declare class SearchConsumer {
    private readonly esService;
    private readonly logger;
    constructor(esService: ElasticsearchService);
    handleMessageCreated(rawPayload: any): Promise<void>;
}
