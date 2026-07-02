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
let MessagesService = class MessagesService {
    constructor(messageRepo) {
        this.messageRepo = messageRepo;
    }
    async create(data) {
        const message = this.messageRepo.create(data);
        return this.messageRepo.save(message);
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
        await this.messageRepo.update({ id: messageId, authorId: userId }, { isDeleted: true });
    }
    async edit(messageId, userId, content) {
        await this.messageRepo.update({ id: messageId, authorId: userId }, { content, editedAt: new Date() });
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], MessagesService);
//# sourceMappingURL=messages.service.js.map