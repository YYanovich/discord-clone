import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ElasticsearchService } from './elasticsearch.service';

interface MessagePayload {
  messageId?: string;
  id?: string;
  content: string;
  channelId: string;
  guildId: string;
  authorId: string;
  createdAt: string;
}

@Controller()
export class SearchConsumer {
  private readonly logger = new Logger('SearchConsumer');

  constructor(private readonly esService: ElasticsearchService) {}

  @EventPattern('messages.created')
  async handleMessageCreated(@Payload() rawPayload: any) {
    try {
      let message: any = rawPayload;

      if (
        rawPayload &&
        typeof rawPayload === 'object' &&
        'value' in rawPayload
      ) {
        message = rawPayload.value;
      }

      if (typeof message === 'string') {
        try {
          message = JSON.parse(message);
        } catch (parseErr) {
          this.logger.error('Failed to parse message payload JSON:', parseErr);
          return;
        }
      }

      if (message && typeof message === 'object') {
        if ('data' in message && message.data) {
          message =
            typeof message.data === 'string'
              ? JSON.parse(message.data)
              : message.data;
        } else if ('payload' in message && message.payload) {
          message =
            typeof message.payload === 'string'
              ? JSON.parse(message.payload)
              : message.payload;
        }
      }

      const messageId = message?.messageId || message?.id;
      const guildId = message?.guildId;

      if (!guildId || !messageId) {
        this.logger.warn(
          `Message payload invalid (messageId=${messageId}, guildId=${guildId}) — skipping ES index\n` +
            `DUMP: ${JSON.stringify(message)}`,
        );
        return;
      }

      const messageDate = new Date(message.createdAt).getTime();
      if (!isNaN(messageDate)) {
        const age = Date.now() - messageDate;
        const ninetyDays = 90 * 24 * 60 * 60 * 1000;

        if (age > ninetyDays) {
          this.logger.log(
            `Message ${messageId} is older than 90 days — skipping ES`,
          );
          return;
        }
      }

      await this.esService.indexMessage({
        messageId,
        guildId: message.guildId,
        content: message.content,
        channelId: message.channelId,
        authorId: message.authorId,
        createdAt: message.createdAt,
      });

      this.logger.log(`Indexed message ${messageId} in ES`);
    } catch (err) {
      this.logger.error(`Failed to index message:`, err);
    }
  }
}
