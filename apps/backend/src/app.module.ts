import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RedisModule } from './common/redis/redis.module';
import { User } from './users/entities/user.entity';
import { Session } from './users/entities/session.entity';
import { Guild } from './guilds/entities/guild.entity';
import { Category } from './guilds/entities/category.entity';
import { Channel } from './guilds/entities/channel.entity';
import { Membership } from './guilds/entities/membership.entity';
import { GuildsModule } from './guilds/guilds.module';
import { Invite } from './guilds/entities/invite.entity';
import { EventsModule } from './events/events.module';
import { Message } from './messages/entities/message.entity';
import { MessagesModule } from './messages/messages.module';
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
      entities: [
        User,
        Session,
        Guild,
        Category,
        Channel,
        Membership,
        Invite,
        Message,
      ],
      synchronize: false,
      migrations: ['dist/migrations/*.js'],
      migrationsRun: true,
    }),

    RedisModule,
    AuthModule,
    UsersModule,
    GuildsModule,
    EventsModule,
    MessagesModule,
  ],
})
export class AppModule {}
