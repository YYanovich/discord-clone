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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const message_entity_1 = require("./entities/message.entity");
const outbox_service_1 = require("../outbox/outbox.service");
let MessagesService = class MessagesService {
    constructor(messageRepo, outboxService, dataSource) {
        this.messageRepo = messageRepo;
        this.outboxService = outboxService;
        this.dataSource = dataSource;
    }
    async create(data) {
        return this.dataSource.transaction(async (manager) => {
            const message = manager.create(message_entity_1.Message, {
                content: data.content,
                channelId: data.channelId,
                authorId: data.authorId,
            });
            const saved = await manager.save(message);
            await this.outboxService.write('messages.created', {
                messageId: saved.id,
                content: saved.content,
                channelId: saved.channelId,
                guildId: data.guildId,
                authorId: saved.authorId,
                createdAt: saved.createdAt.toISOString(),
            }, manager);
            return saved;
        });
    }
    async findByChannel(channelId, before, limit = 50) {
        const query = this.messageRepo
            .createQueryBuilder('message')
            .where('message.channelId = :channelId', { channelId })
            .andWhere('message.isDeleted = false')
            .orderBy('message.createdAt', 'DESC')
            .limit(limit);
        if (before) {
            query.andWhere('message.createdAt < :before', { before });
        }
        const messages = await query.getMany();
        return messages.reverse();
    }
    async softDelete(messageId, userId) {
        await this.dataSource.transaction(async (manager) => {
            const messageRepo = manager.getRepository(message_entity_1.Message);
            const message = await messageRepo.findOne({
                where: { id: messageId },
            });
            if (!message)
                throw new common_1.NotFoundException('Message not found');
            if (message.authorId !== userId)
                throw new common_1.ForbiddenException('Not allowed');
            message.isDeleted = true;
            await messageRepo.save(message);
            await this.outboxService.write('messages.deleted', {
                messageId: message.id,
                channelId: message.channelId,
            }, manager);
        });
    }
    async edit(messageId, userId, content) {
        await this.dataSource.transaction(async (manager) => {
            const messageRepo = manager.getRepository(message_entity_1.Message);
            const message = await messageRepo.findOne({
                where: { id: messageId },
            });
            if (!message)
                throw new common_1.NotFoundException('Message not found');
            if (message.authorId !== userId)
                throw new common_1.ForbiddenException('Not allowed');
            message.content = content;
            message.editedAt = new Date();
            await messageRepo.save(message);
            await this.outboxService.write('messages.updated', {
                messageId: message.id,
                content: message.content,
            }, manager);
        });
    }
    async searchArchive(params) {
        const qb = this.messageRepo
            .createQueryBuilder('m')
            .innerJoin('channels', 'ch', 'ch.id = m.channelId')
            .where('ch.guild_id = :guildId', { guildId: params.guildId })
            .andWhere('m.isDeleted = false')
            .andWhere('similarity(m.content, :query) > 0.1', { query: params.query })
            .orderBy('similarity(m.content, :query)', 'DESC')
            .limit(20);
        if (params.channelId) {
            qb.andWhere('m.channelId = :channelId', { channelId: params.channelId });
        }
        if (params.before) {
            qb.andWhere('m.createdAt < :before', { before: params.before });
        }
        const messages = await qb.getMany();
        return { hits: messages, total: messages.length, isArchive: true };
    }
    async findAll() {
        return this.messageRepo.find({
            relations: {
                channel: true,
            },
            where: { isDeleted: false },
            order: { createdAt: 'ASC' },
            take: 10000,
        });
    }
    async findAllWithGuild() {
        return this.messageRepo.find({
            where: { isDeleted: false },
            relations: { channel: true },
            order: { createdAt: 'ASC' },
            take: 50000,
        });
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __param(2, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        outbox_service_1.OutboxService,
        typeorm_2.DataSource])
], MessagesService);
//# sourceMappingURL=messages.service.js.map