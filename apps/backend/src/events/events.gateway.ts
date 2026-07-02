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

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
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

    this.logger.log(`Client disconnected: ${userId}`);
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
    @MessageBody() data: { channelId: string; before?: string },
  ) {
    const messages = await this.messagesService.findByChannel(
      data.channelId,
      data.before,
    );

    return { event: 'message:history', data: messages };
  }
}
