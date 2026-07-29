import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, PermissionFlag } from './entities/role.entity';
import { MemberRole } from './entities/member-role.entity';
import { ChannelOverwrite } from './entities/channel-overwrite.entity';
import { Guild } from './entities/guild.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(MemberRole)
    private memberRoleRepo: Repository<MemberRole>,
    @InjectRepository(ChannelOverwrite)
    private overwriteRepo: Repository<ChannelOverwrite>,
    @InjectRepository(Guild)
    private guildRepo: Repository<Guild>,
  ) {}

  async computePermissions(
    userId: string,
    guildId: string,
    channelId?: string,
  ): Promise<number> {
    const guild = await this.guildRepo.findOne({ where: { id: guildId } });
    if (guild?.ownerId === userId) return ~0;

    const everyoneRole = await this.roleRepo.findOne({
      where: { guildId, name: '@everyone' },
    });

    const memberRoles = await this.memberRoleRepo.find({
      where: { userId, guildId },
      relations: {
        role: true,
      },
      order: { role: { position: 'DESC' } },
    });

    let permissions = everyoneRole?.permissions ?? 0;

    for (const mr of memberRoles) {
      permissions |= mr.role.permissions;
    }

    if (permissions & PermissionFlag.ADMINISTRATOR) return ~0;

    if (channelId) {
      const overwrites = await this.overwriteRepo.find({
        where: { channelId },
      });

      if (everyoneRole) {
        const everyoneOverwrite = overwrites.find(
          (o) => o.roleId === everyoneRole.id,
        );
        if (everyoneOverwrite) {
          permissions &= ~everyoneOverwrite.deny;
          permissions |= everyoneOverwrite.allow;
        }
      }

      for (const mr of memberRoles) {
        const overwrite = overwrites.find((o) => o.roleId === mr.roleId);
        if (overwrite) {
          permissions &= ~overwrite.deny;
          permissions |= overwrite.allow;
        }
      }

      const userOverwrite = overwrites.find((o) => o.userId === userId);
      if (userOverwrite) {
        permissions &= ~userOverwrite.deny;
        permissions |= userOverwrite.allow;
      }
    }

    return permissions;
  }

  async hasPermission(
    userId: string,
    guildId: string,
    flag: PermissionFlag,
    channelId?: string,
  ): Promise<boolean> {
    const permissions = await this.computePermissions(
      userId,
      guildId,
      channelId,
    );
    return (permissions & flag) === flag;
  }
}
