import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guild } from './entities/guild.entity';
import { Category } from './entities/category.entity';
import { Channel } from './entities/channel.entity';
import { Invite } from './entities/invite.entity';
import { GuildParticipant } from './entities/guild-participant.entity';
import { ChannelParticipant } from './entities/channel-participant.entity';
import { GuildsService } from './guilds.service';
import { GuildsController } from './guilds.controller';
import { PermissionsService } from './permission.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Guild,
      Channel,
      Category,
      Invite,
      GuildParticipant,
      ChannelParticipant,
    ]),
  ],
  controllers: [GuildsController],
  providers: [GuildsService, PermissionsService],
  exports: [GuildsService, PermissionsService],
})
export class GuildsModule {}
