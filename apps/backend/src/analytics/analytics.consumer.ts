import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ClickHouseService } from './clickhouse.service';

@Controller()
export class AnalyticsConsumer {
  private readonly logger = new Logger('AnalyticsConsumer');

  constructor(private chService: ClickHouseService) {}

  @EventPattern('messages.created')
  async handleMessageCreated(
    @Payload() message: {
      messageId: string;
      content: string;
      channelId: string;
      authorId: string;
      createdAt: string;
    },
  ) {
    try {
      await this.chService.insertMessageEvent(message);
    } catch (err) {
      this.logger.error('Failed to insert message event in ClickHouse:', err);
    }
  }
}