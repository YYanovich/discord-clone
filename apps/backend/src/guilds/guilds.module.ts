import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guild } from './entities/guild.entity';
import { Membership } from './entities/membership.entity';
import { Channel } from './entities/channel.entity';
import { Category } from './entities/category.entity';
import { Invite } from './entities/invite.entity';
import { Role } from './entities/role.entity';
import { MemberRole } from './entities/member-role.entity';
import { Ban } from './entities/ban.entity';
import { GuildsService } from './guilds.service';
import { GuildsController } from './guilds.controller';
import { RolesController } from './roles.controller';
import { ChannelOverwrite } from './entities/channel-overwrite.entity';
import { PermissionsService } from './permission.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Guild,
      Membership,
      Channel,
      Category,
      Invite,
      Role,
      MemberRole,
      Ban,
      ChannelOverwrite
    ]),
  ],
  controllers: [GuildsController],
  providers: [GuildsService, PermissionsService],
  exports: [GuildsService, PermissionsService],
})
export class GuildsModule {}
