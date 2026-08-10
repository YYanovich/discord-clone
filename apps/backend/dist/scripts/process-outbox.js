"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const kafkajs_1 = require("kafkajs");
const outbox_entity_1 = require("../src/outbox/entities/outbox.entity");
async function main() {
    const dataSource = new typeorm_1.DataSource({
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5433),
        username: process.env.DB_USER ?? 'discord',
        password: process.env.DB_PASS ?? 'secret',
        database: process.env.DB_NAME ?? 'discord',
        entities: [outbox_entity_1.OutboxEvent],
    });
    await dataSource.initialize();
    console.log('Outbox Processor: Connected to Database');
    const kafka = new kafkajs_1.Kafka({
        clientId: 'outbox-processor',
        brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
    });
    const producer = kafka.producer();
    await producer.connect();
    console.log('Outbox Processor: Connected to Kafka');
    console.log('Outbox Processor started listening for new events...');
    while (true) {
        try {
            const outboxRepo = dataSource.getRepository(outbox_entity_1.OutboxEvent);
            const events = await outboxRepo.find({
                where: { status: outbox_entity_1.OutboxStatus.PENDING },
                order: { createdAt: 'ASC' },
                take: 100,
            });
            if (events.length > 0) {
                console.log(`[${new Date().toISOString()}] Processing ${events.length} outbox events...`);
                for (const event of events) {
                    try {
                        await producer.send({
                            topic: event.topic,
                            messages: [
                                {
                                    value: JSON.stringify({
                                        pattern: event.topic,
                                        data: event.payload,
                                    }),
                                    headers: {
                                        kafka_messagePattern: event.topic,
                                    },
                                },
                            ],
                        });
                        await outboxRepo.update(event.id, {
                            status: outbox_entity_1.OutboxStatus.PUBLISHED,
                            publishedAt: new Date(),
                        });
                        console.log(`  └─ Event ${event.id} (${event.topic}) -> PUBLISHED`);
                    }
                    catch (err) {
                        console.error(`  └─ Failed to publish event ${event.id}:`, err);
                        await outboxRepo.update(event.id, {
                            status: outbox_entity_1.OutboxStatus.FAILED,
                            errorMessage: String(err),
                        });
                    }
                }
            }
        }
        catch (err) {
            console.error('Error in outbox processing loop:', err);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
}
process.on('SIGINT', () => {
    console.log('Shutting down Outbox Processor...');
    process.exit(0);
});
main().catch((err) => {
    console.error('Fatal error in Outbox Processor:', err);
    process.exit(1);
});
//# sourceMappingURL=process-outbox.js.map