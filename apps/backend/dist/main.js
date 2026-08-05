"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const microservices_1 = require("@nestjs/microservices");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.connectMicroservice({
        transport: microservices_1.Transport.KAFKA,
        options: {
            client: {
                clientId: 'discord-clone-search',
                brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
                createPartitioner: require('kafkajs').Partitioners.LegacyPartitioner,
            },
            consumer: {
                groupId: 'discord-clone-search-group',
            },
        },
    });
    app.connectMicroservice({
        transport: microservices_1.Transport.KAFKA,
        options: {
            client: {
                clientId: 'discord-clone-analytics',
                brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
                createPartitioner: require('kafkajs').Partitioners.LegacyPartitioner,
            },
            consumer: {
                groupId: 'discord-clone-analytics-group',
            },
        },
    });
    app.enableCors({
        origin: ['http://localhost:5173', 'http://localhost:4173'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Fingerprint'],
    });
    app.use((0, cookie_parser_1.default)());
    app.setGlobalPrefix('api');
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`Server running on http://localhost:${port}`);
    app.startAllMicroservices().catch((err) => {
        console.error('Kafka microservices warning:', err.message);
    });
}
bootstrap();
//# sourceMappingURL=main.js.map