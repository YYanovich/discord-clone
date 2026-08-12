import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import { RedisService } from '../common/redis/redis.service';
import { PermissionsService } from '../guilds/permission.service';
import { ChannelPermission } from '../guilds/entities/channel-participant.entity';
import { GuildsService } from '../guilds/guilds.service';
import { VoiceService } from '../voice/voice.service';
import { v4 as uuid } from 'uuid';
import { LiveKitService } from '../voice/livekit.service';
import { VoiceAnalyticsService } from '../voice/voice-analytics.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger('EventsGateway');

  constructor(
    private jwtService: JwtService,
    private messagesService: MessagesService,
    private redisService: RedisService,
    private permissionsService: PermissionsService,
    private guildsService: GuildsService,
    private voiceService: VoiceService,
    private livekitService: LiveKitService,
    private voiceAnalyticsService: VoiceAnalyticsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token) as {
        sub: string;
        sessionId: string;
      };

      client.data.userId = payload.sub;
      client.data.sessionId = payload.sessionId;

      this.logger.log(`Client connected: ${payload.sub}`);

      await this.redisService.set(
        `presence:${payload.sub}:${payload.sessionId}`,
        'online',
        45,
      );

      await client.join(`voice:user:${payload.sub}`);

      const guilds = await this.guildsService.findUserGuilds(payload.sub);
      for (const guild of guilds) {
        await client.join(`guild:${guild.id}`);
        this.server.to(`guild:${guild.id}`).emit('presence:update', {
          userId: payload.sub,
          status: 'online',
        });
      }
    } catch (err) {
      this.logger.warn('Invalid token on connect');
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const { userId, sessionId } = client.data;
    if (!userId) return;

    this.logger.log(`Client disconnected: ${userId}`);

    await this.redisService.del(`presence:${userId}:${sessionId}`);

    const otherKeys = await this.redisService.keys(`presence:${userId}:*`);
    if (otherKeys.length === 0) {
      const guilds = await this.guildsService.findUserGuilds(userId);
      for (const guild of guilds) {
        this.server.to(`guild:${guild.id}`).emit('presence:update', {
          userId,
          status: 'offline',
        });
      }
    }

    const voiceData = await this.voiceService.getUserVoiceChannel(userId);
    if (voiceData) {
      const { channelId, guildId } = voiceData;
      await this.handleVoiceLeaveInternal(client, userId, channelId, guildId);
    }
  }

  @SubscribeMessage('guild:join')
  async handleGuildJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { guildId: string },
  ) {
    await client.join(`guild:${data.guildId}`);

    const members = await this.guildsService.getMembers(
      data.guildId,
      client.data.userId,
    );
    for (const member of members) {
      const keys = await this.redisService.keys(`presence:${member.userId}:*`);
      if (keys.length > 0) {
        client.emit('presence:update', {
          userId: member.userId,
          status: 'online',
        });
      }
    }

    const voiceState = await this.voiceService.getGuildVoiceState(data.guildId);
    client.emit('voice:guild-state', voiceState);
  }

  @SubscribeMessage('channel:join')
  async handleChannelJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string; guildId: string },
  ) {
    const { userId } = client.data;

    try {
      await this.permissionsService.checkChannelPermission(
        userId,
        data.channelId,
        ChannelPermission.READ,
      );
    } catch {
      client.emit('error', { message: 'No permission to view this channel' });
      return;
    }

    await client.join(`channel:${data.channelId}`);
    client.emit('channel:join:ack', {
      guildId: data.guildId,
      channelId: data.channelId,
    });
  }

  @SubscribeMessage('heartbeat')
  async handleHeartbeat(@ConnectedSocket() client: Socket) {
    const { userId, sessionId } = client.data;
    if (!userId) return;
    await this.redisService.set(
      `presence:${userId}:${sessionId}`,
      'online',
      45,
    );
    return { event: 'heartbeat:ack', data: { timestamp: Date.now() } };
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string; guildId: string },
  ) {
    client.to(`guild:${data.guildId}`).emit('typing:start', {
      userId: client.data.userId,
      channelId: data.channelId,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string; guildId: string },
  ) {
    client.to(`guild:${data.guildId}`).emit('typing:stop', {
      userId: client.data.userId,
      channelId: data.channelId,
    });
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      channelId: string;
      guildId: string;
      content: string;
    },
  ) {
    const { userId } = client.data;

    try {
      await this.permissionsService.checkChannelPermission(
        userId,
        data.channelId,
        ChannelPermission.WRITE,
      );
    } catch {
      client.emit('error', { message: 'No permission to send messages' });
      return;
    }

    const message = await this.messagesService.create({
      content: data.content,
      channelId: data.channelId,
      authorId: userId,
      guildId: data.guildId,
    });

    this.server.to(`guild:${data.guildId}`).emit('message:new', {
      id: message.id,
      content: message.content,
      channelId: message.channelId,
      authorId: message.authorId,
      createdAt: message.createdAt,
    });

    return { event: 'message:ack', data: { id: message.id } };
  }

  @SubscribeMessage('message:history')
  async handleHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      channelId: string;
      guildId: string;
      before?: string;
    },
  ) {
    const { userId } = client.data;

    try {
      await this.permissionsService.checkChannelPermission(
        userId,
        data.channelId,
        ChannelPermission.READ,
      );
    } catch {
      client.emit('error', { message: 'No permission to view this channel' });
      return;
    }

    const messages = await this.messagesService.findByChannel(
      data.channelId,
      data.before,
    );

    client.emit('message:history', { data: messages });
  }

  @SubscribeMessage('voice:join')
  async handleVoiceJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string; guildId: string },
  ) {
    const { userId } = client.data;
    const { channelId, guildId } = data;

    try {
      await this.permissionsService.checkChannelPermission(
        userId,
        channelId,
        ChannelPermission.READ,
      );
    } catch {
      client.emit('voice:error', {
        message: 'No permission to join voice channel',
      });
      return;
    }

    const currentVoice = await this.voiceService.getUserVoiceChannel(userId);
    if (currentVoice && currentVoice.channelId !== channelId) {
      await this.handleVoiceLeaveInternal(
        client,
        userId,
        currentVoice.channelId,
        currentVoice.guildId,
      );
    }

    await this.voiceService.joinChannel(userId, channelId, guildId);
    await client.join(`voice:${channelId}`);

    const member = await this.guildsService.getMemberInfo(guildId, userId);
    const username = member?.user?.username ?? userId;

    const livekitToken = await this.livekitService.generateToken(
      userId,
      username,
      channelId,
    );

    const participants =
      await this.voiceService.getChannelParticipants(channelId);
    const others = participants.filter((p) => p.userId !== userId);

    client.emit('voice:joined', {
      channelId,
      participants: others,
      livekitToken: livekitToken.token,
      livekitUrl: livekitToken.url,
    });

    client.to(`voice:${channelId}`).emit('voice:user-joined', {
      userId,
      channelId,
    });

    const allParticipants =
      await this.voiceService.getChannelParticipants(channelId);
    this.server.to(`guild:${guildId}`).emit('voice:channel-state', {
      channelId,
      participants: allParticipants,
    });

    await this.voiceAnalyticsService.publishVoiceEvent('voice_join', {
      userId,
      channelId,
      guildId,
    });
  }

  @SubscribeMessage('voice:leave')
  async handleVoiceLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string; guildId: string },
  ) {
    const { userId } = client.data;
    await this.handleVoiceLeaveInternal(
      client,
      userId,
      data.channelId,
      data.guildId,
    );
  }

  @SubscribeMessage('voice:mute')
  async handleVoiceMute(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string; muted: boolean; guildId: string },
  ) {
    const { userId } = client.data;

    const participant = await this.voiceService.setMuted(
      userId,
      data.channelId,
      data.muted,
    );
    if (!participant) return;

    this.server.to(`voice:${data.channelId}`).emit('voice:user-muted', {
      userId,
      muted: data.muted,
    });

    const participants = await this.voiceService.getChannelParticipants(
      data.channelId,
    );
    this.server.to(`guild:${data.guildId}`).emit('voice:channel-state', {
      channelId: data.channelId,
      participants,
    });

    await this.voiceAnalyticsService.publishVoiceEvent(
      data.muted ? 'voice_mute' : 'voice_unmute',
      { userId, channelId: data.channelId, guildId: data.guildId },
    );
  }

  //deafen - mute incoming audio
  @SubscribeMessage('voice:deafen')
  async handleVoiceDeafen(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { channelId: string; deafened: boolean; guildId: string },
  ) {
    const { userId } = client.data;

    const participant = await this.voiceService.setDeafened(
      userId,
      data.channelId,
      data.deafened,
    );
    if (!participant) return;

    this.server.to(`voice:${data.channelId}`).emit('voice:user-deafened', {
      userId,
      deafened: data.deafened,
    });

    await this.voiceAnalyticsService.publishVoiceEvent(
      data.deafened ? 'voice_deafen' : 'voice_undeafen',
      { userId, channelId: data.channelId, guildId: data.guildId },
    );
  }

  //speaking indicator — VAD(Voice Activity Detection)
  //frontend analise user by Web Audio API and tell server if user are apeaking
  @SubscribeMessage('voice:speaking')
  handleVoiceSpeaking(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string; speaking: boolean },
  ) {
    const { userId } = client.data;
    client.to(`voice:${data.channelId}`).emit('voice:user-speaking', {
      userId,
      speaking: data.speaking,
    });
  }

  emitToGuild(guildId: string, event: string, data: unknown) {
    this.server.to(`guild:${guildId}`).emit(event, data);
  }

  async getChannelVoiceParticipants(channelId: string) {
    return this.voiceService.getChannelParticipants(channelId);
  }

  private async handleVoiceLeaveInternal(
    client: Socket,
    userId: string,
    channelId: string,
    guildId: string,
  ) {
    const participant = await this.voiceService.leaveChannel(
      userId,
      channelId,
      guildId,
    );

    if (!participant) return;

    const durationSeconds = Math.floor(
      (Date.now() - new Date(participant.joinedAt).getTime()) / 1000,
    );

    await client.leave(`voice:${channelId}`);

    client.to(`voice:${channelId}`).emit('voice:user-left', {
      userId,
      channelId,
    });

    const remaining = await this.voiceService.getChannelParticipants(channelId);
    this.server.to(`guild:${guildId}`).emit('voice:channel-state', {
      channelId,
      participants: remaining,
    });
    await this.voiceAnalyticsService.publishVoiceEvent('voice_leave', {
      userId,
      channelId,
      guildId,
      durationSeconds,
    });
  }
}
