import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import {
  GuildParticipant,
  GuildPermission,
} from './entities/guild-participant.entity';
import { ChannelPermission } from './entities/channel-participant.entity';
import { ParticipantStatus } from './entities/participant-status.enum';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(GuildParticipant)
    private readonly participantRepo: Repository<GuildParticipant>,
  ) {}

  async checkGuildMembership(guildId: string, userId: string): Promise<void> {
    const participant = await this.participantRepo.findOne({
      where: {
        guildId,
        userId,
        status: ParticipantStatus.PARTICIPANT,
      },
    });
    if (!participant) {
      throw new ForbiddenException('Not a member of this guild');
    }
  }

  async hasPermission(
    userId: string,
    guildId: string,
    flag: GuildPermission,
  ): Promise<boolean> {
    try {
      await this.checkGuildPermission(userId, guildId, flag);
      return true;
    } catch {
      return false;
    }
  }

  async checkGuildPermission(
    userId: string,
    guildId: string,
    flag: GuildPermission,
  ): Promise<void> {
    const result = await this.dataSource.query(
      `
      SELECT gp.permissions, gp.status, g."ownerId" = $1 as is_owner
      FROM guild_participants gp
      JOIN guilds g ON g.id = gp."guildId"
      WHERE gp."guildId" = $2 AND gp."userId" = $1
    `,
      [userId, guildId],
    );

    if (!result[0]) throw new ForbiddenException('Not a member');
    if (result[0].status !== ParticipantStatus.PARTICIPANT) {
      throw new ForbiddenException('Access denied');
    }

    const isOwner = result[0].is_owner;
    const permissions = Number(result[0].permissions);

    const hasPermission =
      isOwner ||
      (permissions & GuildPermission.ADMINISTRATOR) !== 0 ||
      (permissions & flag) !== 0;

    if (!hasPermission)
      throw new ForbiddenException('Insufficient permissions');
  }

  async checkChannelPermission(
    userId: string,
    channelId: string,
    flag: ChannelPermission,
  ): Promise<void> {
    const rawChannel = await this.dataSource.query(
      `SELECT * FROM channels WHERE id = $1`,
      [channelId],
    );

    if (!rawChannel[0]) {
      throw new ForbiddenException('Channel not found');
    }

    const guildId =
      rawChannel[0].guildId ??
      rawChannel[0].guild_id ??
      rawChannel[0].GuildId ??
      null;

    if (!guildId) {
      throw new ForbiddenException('Cannot determine guild for channel');
    }

    const result = await this.dataSource.query(
      `SELECT
         gp.permissions       as guild_permissions,
         gp.status            as guild_status,
         (g."ownerId" = $1)   as is_owner,
         cp.permissions       as channel_permissions
       FROM guild_participants gp
       JOIN guilds g ON g.id = gp."guildId"
       LEFT JOIN channel_participants cp
         ON cp."channelId" = $3 AND cp."userId" = $1
       WHERE gp."guildId" = $2
         AND gp."userId" = $1`,
      [userId, guildId, channelId],
    );

    if (!result[0]) {
      throw new ForbiddenException('Not a member of this guild');
    }

    if (result[0].guild_status !== ParticipantStatus.PARTICIPANT) {
      throw new ForbiddenException('Access denied');
    }

    const isOwner = result[0].is_owner === true || result[0].is_owner === 't';
    if (isOwner) return;

    const guildPerms = Number(result[0].guild_permissions);
    if ((guildPerms & GuildPermission.ADMINISTRATOR) !== 0) return;

    const channelPerms =
      result[0].channel_permissions !== null
        ? Number(result[0].channel_permissions)
        : ChannelPermission.READ | ChannelPermission.WRITE;

    if ((channelPerms & flag) === 0) {
      throw new ForbiddenException('Insufficient channel permissions');
    }
  }

  async getMyGuildPermissions(
    userId: string,
    guildId: string,
  ): Promise<number> {
    const result = await this.dataSource.query(
      `
      SELECT gp.permissions, g."ownerId" = $1 as is_owner
      FROM guild_participants gp
      JOIN guilds g ON g.id = gp."guildId"
      WHERE gp."guildId" = $2 AND gp."userId" = $1
    `,
      [userId, guildId],
    );

    if (!result[0]) return 0;
    if (result[0].is_owner) return ~0;
    return Number(result[0].permissions);
  }
}