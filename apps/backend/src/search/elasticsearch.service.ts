import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

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

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger('ElasticsearchService');
  private client: Client;

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200',
    });
  }

  async onModuleInit() {
    await this.ensureIndex();
  }

  private async ensureIndex(): Promise<void> {
    try {
      const exists = await this.client.indices.exists({ index: 'messages' });
      if (!exists) {
        await this.client.indices.create({
          index: 'messages',
          mappings: {
            properties: {
              messageId: { type: 'keyword' },
              content: { type: 'text', analyzer: 'standard' },
              channelId: { type: 'keyword' },
              guildId: { type: 'keyword' },
              authorId: { type: 'keyword' },
              createdAt: { type: 'date' },
            },
          },
        });
        this.logger.log('Created messages index in Elasticsearch');
      }
    } catch (err) {
      this.logger.error('Failed to create ES index:', err);
    }
  }

  async indexMessage(doc: MessageDocument): Promise<void> {
    await this.client.index({
      index: 'messages',
      id: doc.messageId,
      document: doc,
      refresh: true, 
    });
  }

  async search(params: {
    query: string;
    guildId?: string;
    channelId?: string;
    authorId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<SearchResult> {
    const must: unknown[] = [
      {
        bool: {
          should: [
            {
              match_phrase_prefix: {
                content: {
                  query: params.query,
                },
              },
            },
            {
              match: {
                content: {
                  query: params.query,
                  fuzziness: 'AUTO',
                },
              },
            },
          ],
        },
      },
    ];

    const filter: unknown[] = [];

    if (params.channelId) {
      filter.push({ term: { channelId: params.channelId } });
    }
    if (params.authorId) {
      filter.push({ term: { authorId: params.authorId } });
    }
    if (params.guildId) {
      filter.push({ term: { guildId: params.guildId } });
    }
    if (params.from || params.to) {
      filter.push({
        range: {
          createdAt: {
            ...(params.from && { gte: params.from }),
            ...(params.to && { lte: params.to }),
          },
        },
      });
    }

    const result = await this.client.search<MessageDocument>({
      index: 'messages',
      from: ((Number(params.page) || 1) - 1) * (Number(params.limit) || 20),
      size: Number(params.limit) || 20,
      query: { bool: { must, filter } },
      sort: [{ createdAt: { order: 'desc' } }],
      highlight: {
        fields: { content: {} },
      },
    });

    const hits = result.hits.hits.map((hit) => ({
      ...hit._source!,
      highlight: hit.highlight?.content?.[0],
    }));

    const total =
      typeof result.hits.total === 'number'
        ? result.hits.total
        : (result.hits.total?.value ?? 0);

    return { hits, total };
  }
}
