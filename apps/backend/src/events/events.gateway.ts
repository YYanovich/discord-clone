import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { GuildsService } from '../guilds/guilds.service';
import { RedisService } from '../common/redis/redis.service';
import { Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import { MessagesService } from '../messages/messages.service';
import { PermissionsService } from '../guilds/permission.service';
import { GuildPermission } from '../guilds/entities/guild-participant.entity';
import { VoiceService } from '../voice/voice.service';
import { LiveKitService } from '../voice/livekit.service';
import { VoiceAnalyticsService } from '../voice/voice-analytics.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    credentials: true,
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private logger = new Logger('EventsGateway');

  private userSockets = new Map<string, Set<Socket>>();

  constructor(
    private jwtService: JwtService,
    private guildsService: GuildsService,
    private redisService: RedisService,
    private messagesService: MessagesService,
    private permissionsService: PermissionsService,
    private voiceService: VoiceService,
    private livekitService: LiveKitService,
    private voiceAnalyticsService: VoiceAnalyticsService,
  ) {}

  async afterInit(server: Server) {
    const pubClient = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
    });

    const subClient = pubClient.duplicate();

    server.adapter(createAdapter(pubClient, subClient));

    this.logger.log('Socket.IO Redis Adapter initialized');
  }

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

      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      this.userSockets.get(payload.sub)!.add(client);

      const guilds = await this.guildsService.findUserGuilds(payload.sub);
      const guildIds = guilds.map((g) => g.id);
      client.data.guildIds = guildIds;

      for (const guildId of guildIds) {
        client.join(`guild:${guildId}`);
      }

      await client.join(`voice:user:${payload.sub}`);

      await this.redisService.set(
        `presence:${payload.sub}:${payload.sessionId}`,
        'online',
        45,
      );

      for (const guildId of guildIds) {
        this.server.to(`guild:${guildId}`).emit('presence:update', {
          userId: payload.sub,
          status: 'online',
        });
      }

      this.logger.log(`Client connected: ${payload.sub}`);
    } catch {
      this.logger.warn('Invalid token on connect');
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const { userId, sessionId, guildIds } = client.data;
    if (!userId) return;

    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(client);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    await this.redisService.del(`presence:${userId}:${sessionId}`);

    const otherSessions = await this.redisService.keys(`presence:${userId}:*`);

    if (otherSessions.length === 0 && guildIds && Array.isArray(guildIds)) {
      for (const guildId of guildIds) {
        this.server.to(`guild:${guildId}`).emit('presence:update', {
          userId,
          status: 'offline',
        });
      }
    }

    try {
      const voiceData = await this.voiceService.getUserVoiceChannel(userId);
      if (voiceData) {
        const { channelId, guildId } = voiceData;
        await this.handleVoiceLeaveInternal(client, userId, channelId, guildId);
      }
    } catch (e) {
      this.logger.error(`Error handling voice disconnect for ${userId}`, e);
    }

    this.logger.log(`Client disconnected: ${userId}`);
  }

  @SubscribeMessage('guild:join')
  async handleGuildJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { guildId: string },
  ) {
    client.join(`guild:${data.guildId}`);

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

    try {
      const voiceState = await this.voiceService.getGuildVoiceState(
        data.guildId,
      );
      client.emit('voice:guild-state', voiceState);
    } catch (e) {
      this.logger.error('Error fetching voice guild state', e);
    }
  }

  @SubscribeMessage('channel:join')
  async handleChannelJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string; guildId: string },
  ) {
    const { userId } = client.data;

    const canView = await this.permissionsService.hasPermission(
      userId,
      data.guildId,
      GuildPermission.VIEW_CHANNELS,
    );

    if (!canView) {
      client.emit('error', {
        message: 'Missing permissions to view this channel',
      });
      return;
    }

    client.join(`channel:${data.channelId}`);
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

  emitToGuild(guildId: string, event: string, data: unknown) {
    this.server.to(`guild:${guildId}`).emit(event, data);
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { channelId: string; guildId: string; content: string },
  ) {
    const { userId } = client.data;

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
    data: { channelId: string; guildId: string; before?: string },
  ) {
    const { userId } = client.data;

    const canView = await this.permissionsService.hasPermission(
      userId,
      data.guildId,
      GuildPermission.VIEW_CHANNELS,
    );

    if (!canView) {
      client.emit('error', {
        message: 'Missing permissions to view this channel',
      });
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

    this.logger.log(
      `voice:join from ${userId} to channel ${channelId} in guild ${guildId}`,
    );
  try {
    const isMember = await this.guildsService.getMemberInfo(guildId, userId);
    if (!isMember) {
      throw new Error('User is not a member of this guild');
    }
  } catch (err: any) { 
    this.logger.error(`Voice join denied: ${err.message}`);
    client.emit('voice:error', { message: 'Not a member of this server' });
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

    let livekitCredentials: { token: string; url: string };
    try {
      let username = userId;
      try {
        const member = await this.guildsService.getMemberInfo(guildId, userId);
        username = member?.user?.username ?? userId;
      } catch {}

      livekitCredentials = await this.livekitService.generateToken(
        userId,
        username,
        channelId,
      );
    } catch (err) {
      this.logger.error('LiveKit token generation failed:', err);
      client.emit('voice:error', {
        message: 'Failed to generate voice token. Is LiveKit running?',
      });
      await this.voiceService.leaveChannel(userId, channelId, guildId);
      await client.leave(`voice:${channelId}`);
      return;
    }

    const allParticipants =
      await this.voiceService.getChannelParticipants(channelId);
    const others = allParticipants.filter((p) => p.userId !== userId);

    client.emit('voice:joined', {
      channelId,
      participants: others,
      livekitToken: livekitCredentials.token,
      livekitUrl: livekitCredentials.url,
    });

    client
      .to(`voice:${channelId}`)
      .emit('voice:user-joined', { userId, channelId });

    this.server.to(`guild:${guildId}`).emit('voice:channel-state', {
      channelId,
      participants: allParticipants,
    });

    try {
      await this.voiceAnalyticsService.publishVoiceEvent('voice_join', {
        userId,
        channelId,
        guildId,
      });
    } catch {}

    this.logger.log(
      `User ${userId} successfully joined voice channel ${channelId}`,
    );
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

    try {
      await this.voiceAnalyticsService.publishVoiceEvent(
        data.muted ? 'voice_mute' : 'voice_unmute',
        { userId, channelId: data.channelId, guildId: data.guildId },
      );
    } catch {}
  }

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

    try {
      await this.voiceAnalyticsService.publishVoiceEvent(
        data.deafened ? 'voice_deafen' : 'voice_undeafen',
        { userId, channelId: data.channelId, guildId: data.guildId },
      );
    } catch {}
  }

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

    client.leave(`voice:${channelId}`);

    client.to(`voice:${channelId}`).emit('voice:user-left', {
      userId,
      channelId,
    });

    const remaining = await this.voiceService.getChannelParticipants(channelId);
    this.server.to(`guild:${guildId}`).emit('voice:channel-state', {
      channelId,
      participants: remaining,
    });

    try {
      await this.voiceAnalyticsService.publishVoiceEvent('voice_leave', {
        userId,
        channelId,
        guildId,
        durationSeconds,
      });
    } catch {}
  }
}
