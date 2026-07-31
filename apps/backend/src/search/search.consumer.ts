import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ElasticsearchService, MessageDocument } from './elasticsearch.service';

@Controller()
export class SearchConsumer {
  private readonly logger = new Logger('SearchConsumer');

  constructor(private readonly esService: ElasticsearchService) {}

  @EventPattern('messages.created')
  async handleMessageCreated(@Payload() payload: any) {
    try {
      const data = typeof payload === 'string' ? JSON.parse(payload) : payload;

      if (!data) return;

      const doc: MessageDocument = {
        messageId: data.messageId || data.id,
        guildId: data.guildId,
        channelId: data.channelId,
        authorId: data.authorId || data.userId,
        content: data.content,
        createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
      };

      if (!doc.messageId || !doc.content) {
        this.logger.warn(`Skipping invalid payload structure: ${JSON.stringify(payload)}`);
        return;
      }

      await this.esService.indexMessage(doc);
      this.logger.log(`Successfully indexed message ${doc.messageId} to Elasticsearch`);
    } catch (err) {
      this.logger.error('Failed to index message in ES:', err);
    }
  }
}