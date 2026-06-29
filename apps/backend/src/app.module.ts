import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RedisModule } from './common/redis/redis.module';
import { User } from './users/entities/user.entity';
import { Session } from './users/entities/session.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5433),
      username: process.env.DB_USER ?? 'discord',
      password: process.env.DB_PASS ?? 'secret',
      database: process.env.DB_NAME ?? 'discord',
      entities: [User, Session],
      synchronize: false,
      migrations: ['dist/migrations/*.js'],
      migrationsRun: true,
    }),

    RedisModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
