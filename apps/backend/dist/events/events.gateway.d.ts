import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { GuildsService } from '../guilds/guilds.service';
import { RedisService } from '../common/redis/redis.service';
import { MessagesService } from '../messages/messages.service';
export declare class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private guildsService;
    private redisService;
    private messagesService;
    server: Server;
    private logger;
    private userSockets;
    constructor(jwtService: JwtService, guildsService: GuildsService, redisService: RedisService, messagesService: MessagesService);
    afterInit(server: Server): Promise<void>;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    handleHeartbeat(client: Socket): Promise<{
        event: string;
        data: {
            timestamp: number;
        };
    }>;
    handleTypingStart(client: Socket, data: {
        channelId: string;
        guildId: string;
    }): void;
    handleTypingStop(client: Socket, data: {
        channelId: string;
        guildId: string;
    }): void;
    emitToGuild(guildId: string, event: string, data: unknown): void;
    handleMessage(client: Socket, data: {
        channelId: string;
        guildId: string;
        content: string;
    }): Promise<{
        event: string;
        data: {
            id: string;
        };
    }>;
    handleHistory(client: Socket, data: {
        channelId: string;
        before?: string;
    }): Promise<{
        event: string;
        data: import("../messages/entities/message.entity").Message[];
    }>;
}
