import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ElasticsearchService } from './elasticsearch.service';

@Controller()
export class SearchConsumer {
  private readonly logger = new Logger('SearchConsumer');

  constructor(private esService: ElasticsearchService) {}

  @EventPattern('messages.created')
  async handleMessageCreated(
    @Payload()
    message: {
      messageId: string;
      content: string;
      channelId: string;
      guildId: string;
      authorId: string;
      createdAt: string;
    },
  ) {
    try {
      await this.esService.indexMessage(message);
    } catch (err) {
      this.logger.error('Failed to index message in ES:', err);
    }
  }
}
