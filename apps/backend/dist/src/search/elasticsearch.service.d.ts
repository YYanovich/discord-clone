import { OnModuleInit } from '@nestjs/common';
export interface MessageDocument {
    messageId: string;
    guildId: string;
    content: string;
    channelId: string;
    authorId: string;
    createdAt: string;
}
export interface SearchResult {
    hits: MessageDocument[];
    total: number;
}
export declare class ElasticsearchService implements OnModuleInit {
    private readonly logger;
    private client;
    constructor();
    onModuleInit(): Promise<void>;
    private ensureIndex;
    indexMessage(doc: MessageDocument): Promise<void>;
    search(params: {
        query: string;
        guildId?: string;
        channelId?: string;
        authorId?: string;
        from?: string;
        to?: string;
        page?: number;
        limit?: number;
    }): Promise<SearchResult>;
}
