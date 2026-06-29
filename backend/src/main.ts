import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Fingerprint'], 
  });
  app.use(cookieParser());
  app.setGlobalPrefix('api');

  await app.listen(3000);//cluster to 2-3 nodes
  console.log('Server running on http://localhost:3000');
}
bootstrap();
