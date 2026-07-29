import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { Cron } from '@nestjs/schedule';
import { OutboxEvent, OutboxStatus } from './entities/outbox.entity';

@Injectable()
export class OutboxService implements OnModuleInit {
  private readonly logger = new Logger('OutboxService');
  private isPublishing = false; 

  constructor(
    @InjectRepository(OutboxEvent)
    private outboxRepo: Repository<OutboxEvent>,
    @Inject('KAFKA_CLIENT')
    private kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  async write(
    topic: string,
    payload: Record<string, unknown>,
    entityManager?: import('typeorm').EntityManager,
  ): Promise<void> {
    const repo = entityManager
      ? entityManager.getRepository(OutboxEvent)
      : this.outboxRepo;
    await repo.save(repo.create({ topic, payload, status: OutboxStatus.PENDING }));
  }

  @Cron('*/5 * * * * *')
  async publishPending(): Promise<void> {
    if (this.isPublishing) return;
    this.isPublishing = true;

    try {
      const events = await this.outboxRepo.find({
        where: { status: OutboxStatus.PENDING },
        order: { createdAt: 'ASC' },
        take: 100,
      });

      for (const event of events) {
        try {
          await this.kafkaClient
            .emit(event.topic, {
              key: event.id,
              value: JSON.stringify(event.payload),
            })
            .toPromise();

          await this.outboxRepo.update(event.id, {
            status: OutboxStatus.PUBLISHED,
            publishedAt: new Date(),
          });
        } catch (err) {
          this.logger.error(`Failed to publish outbox event ${event.id}:`, err);
          await this.outboxRepo.update(event.id, {
            status: OutboxStatus.FAILED,
            errorMessage: String(err),
          });
        }
      }
    } finally {
      this.isPublishing = false;
    }
  }
}