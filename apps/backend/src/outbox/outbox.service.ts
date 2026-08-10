import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, EntityManager } from 'typeorm';
import { OutboxEvent, OutboxStatus } from './entities/outbox.entity';

//deleted Cron decorator
//publishPending is in another OS level script

@Injectable()
export class OutboxService {
  constructor(
    @InjectRepository(OutboxEvent)
    private outboxRepo: Repository<OutboxEvent>,
  ) {}


  async write(
    topic: string,
    payload: Record<string, unknown>,
    entityManager?: EntityManager,
  ): Promise<void> {
    const repo = entityManager
      ? entityManager.getRepository(OutboxEvent)
      : this.outboxRepo;

    await repo.save(
      repo.create({
        topic,
        payload,
        status: OutboxStatus.PENDING,
      }),
    );
  }
}