import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ClickHouseService } from '../analytics/clickhouse.service';
import type { IVoiceEventPayload } from './voice-analytics.service';

@Controller()
export class VoiceAnalyticsConsumer {
  private readonly logger = new Logger('VoiceAnalyticsConsumer');

  constructor(private readonly clickhouseService: ClickHouseService) {}

  @EventPattern('call-events')
  async handleVoiceEvent(@Payload() rawPayload: any) {
    try {
      let payload: IVoiceEventPayload = rawPayload;

      if (rawPayload && typeof rawPayload === 'object' && 'value' in rawPayload) {
        payload = rawPayload.value;
      }
      if (typeof payload === 'string') {
        payload = JSON.parse(payload);
      }

      const eventTypeMap: Record<string, string> = {
        voice_join: 'join',
        voice_leave: 'leave',
        voice_mute: 'mute',
        voice_unmute: 'unmute',
        voice_deafen: 'deafen',
        voice_undeafen: 'undeafen',
      };

      const chEventType = eventTypeMap[payload.eventType] ?? payload.eventType;

      await this.clickhouseService.insertVoiceEvent({
        eventId: payload.eventId,
        guildId: payload.guildId,
        channelId: payload.channelId,
        userId: payload.userId,
        eventType: chEventType as any,
        durationSeconds: payload.durationSeconds,
        createdAt: payload.createdAt,
      });

      this.logger.log(`Processed voice event ${payload.eventType} from Kafka`);
    } catch (err) {
      this.logger.error('Failed to process voice event:', err);
    }
  }
}