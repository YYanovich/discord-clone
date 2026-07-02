"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const guilds_service_1 = require("../guilds/guilds.service");
const redis_service_1 = require("../common/redis/redis.service");
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
const redis_adapter_1 = require("@socket.io/redis-adapter");
const messages_service_1 = require("../messages/messages.service");
let EventsGateway = class EventsGateway {
    constructor(jwtService, guildsService, redisService, messagesService) {
        this.jwtService = jwtService;
        this.guildsService = guildsService;
        this.redisService = redisService;
        this.messagesService = messagesService;
        this.logger = new common_1.Logger('EventsGateway');
        this.userSockets = new Map();
    }
    async afterInit(server) {
        const pubClient = new ioredis_1.default({
            host: process.env.REDIS_HOST ?? 'localhost',
            port: Number(process.env.REDIS_PORT ?? 6379),
        });
        const subClient = pubClient.duplicate();
        server.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
        this.logger.log('Socket.IO Redis Adapter initialized');
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token;
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token);
            client.data.userId = payload.sub;
            client.data.sessionId = payload.sessionId;
            if (!this.userSockets.has(payload.sub)) {
                this.userSockets.set(payload.sub, new Set());
            }
            this.userSockets.get(payload.sub).add(client);
            const guilds = await this.guildsService.findUserGuilds(payload.sub);
            const guildIds = guilds.map((g) => g.id);
            client.data.guildIds = guildIds;
            for (const guildId of guildIds) {
                client.join(`guild:${guildId}`);
            }
            await this.redisService.set(`presence:${payload.sub}:${payload.sessionId}`, 'online', 45);
            for (const guildId of guildIds) {
                this.server.to(`guild:${guildId}`).emit('presence:update', {
                    userId: payload.sub,
                    status: 'online',
                });
            }
            this.logger.log(`Client connected: ${payload.sub}`);
        }
        catch {
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        const { userId, sessionId, guildIds } = client.data;
        if (!userId)
            return;
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
    async handleHeartbeat(client) {
        const { userId, sessionId } = client.data;
        if (!userId)
            return;
        await this.redisService.set(`presence:${userId}:${sessionId}`, 'online', 45);
        return { event: 'heartbeat:ack', data: { timestamp: Date.now() } };
    }
    handleTypingStart(client, data) {
        client.to(`guild:${data.guildId}`).emit('typing:start', {
            userId: client.data.userId,
            channelId: data.channelId,
        });
    }
    handleTypingStop(client, data) {
        client.to(`guild:${data.guildId}`).emit('typing:stop', {
            userId: client.data.userId,
            channelId: data.channelId,
        });
    }
    emitToGuild(guildId, event, data) {
        this.server.to(`guild:${guildId}`).emit(event, data);
    }
    async handleMessage(client, data) {
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
    async handleHistory(client, data) {
        const messages = await this.messagesService.findByChannel(data.channelId, data.before);
        return { event: 'message:history', data: messages };
    }
};
exports.EventsGateway = EventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('heartbeat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "handleHeartbeat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing:start'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleTypingStart", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing:stop'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleTypingStop", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('message:send'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('message:history'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "handleHistory", null);
exports.EventsGateway = EventsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: 'http://localhost:5173',
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        guilds_service_1.GuildsService,
        redis_service_1.RedisService,
        messages_service_1.MessagesService])
], EventsGateway);
//# sourceMappingURL=events.gateway.js.map