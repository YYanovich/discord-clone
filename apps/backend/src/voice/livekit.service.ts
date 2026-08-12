import { Injectable, Logger } from '@nestjs/common';
import {
  AccessToken,
  WebhookReceiver,
  type WebhookEvent,
  RoomServiceClient,
} from 'livekit-server-sdk';

export interface ILiveKitTokenResult {
  token: string;
  url: string;
}

@Injectable()
export class LiveKitService {
  private readonly logger = new Logger('LiveKitService');

  private readonly apiKey = process.env.LIVEKIT_API_KEY ?? 'devkey';
  private readonly apiSecret = process.env.LIVEKIT_API_SECRET ?? 'secret';
  private readonly livekitUrl = process.env.LIVEKIT_URL ?? 'ws://localhost:7880';

  private readonly roomService = new RoomServiceClient(
    this.livekitUrl.replace('ws://', 'http://').replace('wss://', 'https://'),
    this.apiKey,
    this.apiSecret,
  );

  private readonly webhookReceiver = new WebhookReceiver(
    this.apiKey,
    this.apiSecret,
  );

  async generateToken(
    userId: string,
    username: string,
    channelId: string,
    options?: {
      canPublish?: boolean; 
      canSubscribe?: boolean; 
    },
  ): Promise<ILiveKitTokenResult> {
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: userId,  
      name: username,  
      ttl: 3600,       
    });

    at.addGrant({
      roomJoin: true,
      room: channelId,    
      canPublish: options?.canPublish ?? true,
      canSubscribe: options?.canSubscribe ?? true,
      canPublishData: true, 
    });

    return {
      token: await at.toJwt(),
      url: this.livekitUrl,
    };
  }

  async receiveWebhook(
    body: string,
    authHeader: string,
  ): Promise<WebhookEvent> {
    return this.webhookReceiver.receive(body, authHeader);
  }

  async removeParticipant(channelId: string, userId: string): Promise<void> {
    try {
      await this.roomService.removeParticipant(channelId, userId);
      this.logger.log(`Removed ${userId} from LiveKit room ${channelId}`);
    } catch (err) {
      this.logger.error(`Failed to remove participant:`, err);
    }
  }

  async muteParticipant(
    channelId: string,
    userId: string,
    trackSid: string,
    muted: boolean,
  ): Promise<void> {
    try {
      await this.roomService.mutePublishedTrack(
        channelId,
        userId,
        trackSid,
        muted,
      );
    } catch (err) {
      this.logger.error(`Failed to mute participant:`, err);
    }
  }

  async getRoomParticipants(channelId: string) {
    try {
      return await this.roomService.listParticipants(channelId);
    } catch {
      return [];
    }
  }
}