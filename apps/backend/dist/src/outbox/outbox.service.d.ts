import type { Repository, EntityManager } from 'typeorm';
import { OutboxEvent } from './entities/outbox.entity';
export declare class OutboxService {
    private outboxRepo;
    constructor(outboxRepo: Repository<OutboxEvent>);
    write(topic: string, payload: Record<string, unknown>, entityManager?: EntityManager): Promise<void>;
}
