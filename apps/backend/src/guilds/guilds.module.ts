import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuildsService } from './guilds.service';
import { GuildsController } from './guilds.controller';
import { Guild } from './entities/guild.entity';
import { Category } from './entities/category.entity';
import { Channel } from './entities/channel.entity';
import { Membership } from './entities/membership.entity';
import { Invite } from './entities/invite.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Guild, Category, Channel, Membership, Invite]),
  ],
  providers: [GuildsService],
  controllers: [GuildsController],
  exports: [GuildsService],
})
export class GuildsModule {}
