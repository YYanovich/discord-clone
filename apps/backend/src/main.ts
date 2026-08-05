import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
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

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
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

  app.use(cookieParser());
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);

  app.startAllMicroservices().catch((err) => {
    console.error('Kafka microservices warning:', err.message);
  });
}
bootstrap();