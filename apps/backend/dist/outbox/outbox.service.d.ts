import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { OutboxEvent } from './entities/outbox.entity';
export declare class OutboxService implements OnModuleInit {
    private outboxRepo;
    private kafkaClient;
    private readonly logger;
    private isPublishing;
    constructor(outboxRepo: Repository<OutboxEvent>, kafkaClient: ClientKafka);
    onModuleInit(): Promise<void>;
    write(topic: string, payload: Record<string, unknown>, entityManager?: import('typeorm').EntityManager): Promise<void>;
    publishPending(): Promise<void>;
}
