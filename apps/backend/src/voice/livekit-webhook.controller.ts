import {
  Controller,
  Post,
  Headers,
  Body,
  RawBodyRequest,
  Req,
  Logger,
  HttpCode,
} from '@nestjs/common';
import type { Request } from 'express';
import { LiveKitService } from './livekit.service';
import { VoiceService } from './voice.service';
import { VoiceAnalyticsService } from './voice-analytics.service';

@Controller('webhooks/livekit')
export class LiveKitWebhookController {
  private readonly logger = new Logger('LiveKitWebhookController');

  constructor(
    private readonly livekitService: LiveKitService,
    private readonly voiceService: VoiceService,
    private readonly voiceAnalyticsService: VoiceAnalyticsService,
  ) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('authorization') authHeader: string,
  ) {
    try {
      const body = req.rawBody?.toString() ?? '';
      const event = await this.livekitService.receiveWebhook(body, authHeader);

      this.logger.log(`LiveKit webhook: ${event.event}`);

      switch (event.event) {
        case 'participant_joined': {
          const { room, participant } = event;
          if (!room || !participant) break;

          this.logger.log(
            `LiveKit: ${participant.identity} joined room ${room.name}`,
          );
          break;
        }

        case 'participant_left': {
          const { room, participant } = event;
          if (!room || !participant) break;

          const userId = participant.identity;
          const channelId = room.name;

          this.logger.log(
            `LiveKit: ${userId} left room ${channelId} (timeout/disconnect)`,
          );

          const voiceData = await this.voiceService.getUserVoiceChannel(userId);
          if (voiceData) {
            const participantData = await this.voiceService.getChannelParticipants(channelId);
            const p = participantData.find(pt => pt.userId === userId);

            if (p) {
              const durationSeconds = Math.floor(
                (Date.now() - new Date(p.joinedAt).getTime()) / 1000,
              );

              await this.voiceService.leaveChannel(userId, channelId, voiceData.guildId);

              await this.voiceAnalyticsService.publishVoiceEvent('voice_leave', {
                userId,
                channelId,
                guildId: voiceData.guildId,
                durationSeconds,
              });
            }
          }
          break;
        }

        case 'room_started': {
          this.logger.log(`LiveKit room created: ${event.room?.name}`);
          break;
        }

        case 'room_finished': {
          this.logger.log(`LiveKit room finished: ${event.room?.name}`);
          break;
        }
      }

      return { ok: true };
    } catch (err) {
      this.logger.error('LiveKit webhook error:', err);
      return { ok: false };
    }
  }
}