import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { v4 as uuid } from 'uuid';

export type VoiceEventType = 'voice_join' | 'voice_leave' | 'voice_mute' | 'voice_unmute' | 'voice_deafen' | 'voice_undeafen';

export interface IVoiceEventPayload {
  eventId: string;
  eventType: VoiceEventType;
  userId: string;
  channelId: string;
  guildId: string;
  durationSeconds?: number;
  createdAt: string;
}

@Injectable()
export class VoiceAnalyticsService {
  private readonly logger = new Logger('VoiceAnalyticsService');

  constructor(
    @Inject('KAFKA_CLIENT')
    private readonly kafkaClient: ClientKafka,
  ) {}

  async publishVoiceEvent(
    eventType: VoiceEventType,
    data: {
      userId: string;
      channelId: string;
      guildId: string;
      durationSeconds?: number;
    },
  ): Promise<void> {
    const payload: IVoiceEventPayload = {
      eventId: uuid(),
      eventType,
      userId: data.userId,
      channelId: data.channelId,
      guildId: data.guildId,
      durationSeconds: data.durationSeconds,
      createdAt: new Date().toISOString(),
    };

    try {
      await this.kafkaClient
        .emit('call-events', {
          key: payload.eventId,
          value: JSON.stringify(payload),
        })
        .toPromise();

      this.logger.log(`Published ${eventType} for user ${data.userId}`);
    } catch (err) {
      this.logger.error(`Failed to publish voice event:`, err);
    }
  }
}