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
exports.OutboxService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const microservices_1 = require("@nestjs/microservices");
const schedule_1 = require("@nestjs/schedule");
const outbox_entity_1 = require("./entities/outbox.entity");
let OutboxService = class OutboxService {
    constructor(outboxRepo, kafkaClient) {
        this.outboxRepo = outboxRepo;
        this.kafkaClient = kafkaClient;
        this.logger = new common_1.Logger('OutboxService');
        this.isPublishing = false;
    }
    async onModuleInit() {
        await this.kafkaClient.connect();
    }
    async write(topic, payload, entityManager) {
        const repo = entityManager
            ? entityManager.getRepository(outbox_entity_1.OutboxEvent)
            : this.outboxRepo;
        await repo.save(repo.create({ topic, payload, status: outbox_entity_1.OutboxStatus.PENDING }));
    }
    async publishPending() {
        if (this.isPublishing)
            return;
        this.isPublishing = true;
        try {
            const events = await this.outboxRepo.find({
                where: [
                    { status: outbox_entity_1.OutboxStatus.PENDING },
                    { status: outbox_entity_1.OutboxStatus.FAILED },
                ],
                order: { createdAt: 'ASC' },
                take: 100,
            });
            for (const event of events) {
                try {
                    await this.kafkaClient
                        .emit(event.topic, {
                        key: event.id,
                        value: event.payload,
                    })
                        .toPromise();
                    await this.outboxRepo.update(event.id, {
                        status: outbox_entity_1.OutboxStatus.PUBLISHED,
                        publishedAt: new Date(),
                        errorMessage: null,
                    });
                    this.logger.log(`Successfully published outbox event ${event.id} to ${event.topic}`);
                }
                catch (err) {
                    this.logger.error(`Failed to publish outbox event ${event.id}:`, err);
                    await this.outboxRepo.update(event.id, {
                        status: outbox_entity_1.OutboxStatus.FAILED,
                        errorMessage: String(err),
                    });
                }
            }
        }
        finally {
            this.isPublishing = false;
        }
    }
};
exports.OutboxService = OutboxService;
__decorate([
    (0, schedule_1.Cron)('*/5 * * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OutboxService.prototype, "publishPending", null);
exports.OutboxService = OutboxService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(outbox_entity_1.OutboxEvent)),
    __param(1, (0, common_1.Inject)('KAFKA_CLIENT')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        microservices_1.ClientKafka])
], OutboxService);
//# sourceMappingURL=outbox.service.js.map