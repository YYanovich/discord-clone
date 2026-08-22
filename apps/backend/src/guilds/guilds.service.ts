import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Guild } from './entities/guild.entity';
import { Category } from './entities/category.entity';
import { Channel, ChannelType } from './entities/channel.entity';
import { Invite } from './entities/invite.entity';
import {
  GuildParticipant,
  GuildPermission,
} from './entities/guild-participant.entity';
import { ChannelParticipant } from './entities/channel-participant.entity';
import { ParticipantStatus } from './entities/participant-status.enum';
import { CreateChannelDto } from './dto/create-channel.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
import * as crypto from 'crypto';

@Injectable()
export class GuildsService {
  constructor(
    @InjectRepository(Guild)
    private guildRepo: Repository<Guild>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(Channel)
    private channelRepo: Repository<Channel>,
    @InjectRepository(GuildParticipant)
    private participantRepo: Repository<GuildParticipant>,
    @InjectRepository(ChannelParticipant)
    private channelParticipantRepo: Repository<ChannelParticipant>,
    @InjectRepository(Invite)
    private inviteRepo: Repository<Invite>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async createGuild(name: string, ownerId: string): Promise<Guild> {
    if (!name || !name.trim()) {
      throw new BadRequestException('Guild name is required');
    }

    return this.dataSource.transaction(async (manager) => {
      const guild = manager.create(Guild, {
        name: name.trim(),
        ownerId,
      });
      const savedGuild = await manager.save(guild);

      const participant = manager.create(GuildParticipant, {
        guildId: savedGuild.id,
        userId: ownerId,
        inviterId: null,
        permissions: ~0,
        status: ParticipantStatus.PARTICIPANT,
      });
      await manager.save(participant);

      return manager.findOne(Guild, {
        where: { id: savedGuild.id },
        relations: { channels: true, categories: true },
      }) as Promise<Guild>;
    });
  }

  async findUserGuilds(userId: string): Promise<Guild[]> {
    const participants = await this.participantRepo.find({
      where: { userId, status: ParticipantStatus.PARTICIPANT },
      relations: { guild: true },
    });
    return participants.map((p) => p.guild);
  }

  async findGuildById(guildId: string, userId: string): Promise<Guild> {
    await this.assertMembership(guildId, userId);

    const guild = await this.guildRepo.findOne({
      where: { id: guildId },
      relations: { categories: true, channels: true },
    });
    if (!guild) throw new NotFoundException('Guild not found');
    return guild;
  }

  async createChannel(
    guildId: string,
    userId: string,
    dto: CreateChannelDto,
  ): Promise<Channel> {
    await this.assertMembership(guildId, userId);

    const channel = this.channelRepo.create({
      name: dto.name,
      type: dto.type, 
      guildId,
      categoryId: dto.categoryId ?? null,
    });
    return this.channelRepo.save(channel);
  }

  async createCategory(
    guildId: string,
    userId: string,
    name: string,
  ): Promise<Category> {
    await this.assertMembership(guildId, userId);

    const category = this.categoryRepo.create({
      name,
      guildId,
    });
    return this.categoryRepo.save(category);
  }

  async createInvite(
    guildId: string,
    userId: string,
    dto: CreateInviteDto = {},
  ): Promise<Invite> {
    await this.assertMembership(guildId, userId);

    const code = crypto.randomBytes(4).toString('hex');
    const expiresAt = dto.expiresInHours
      ? new Date(Date.now() + dto.expiresInHours * 60 * 60 * 1000)
      : null;

    const invite = this.inviteRepo.create({
      code,
      guildId,
      createdById: userId,
      maxUses: dto.maxUses ?? null,
      uses: 0,
      expiresAt,
    });
    return this.inviteRepo.save(invite);
  }

  async joinByInvite(code: string, userId: string): Promise<void> {
    const invite = await this.inviteRepo.findOne({ where: { code } });
    if (!invite) throw new NotFoundException('Invalid invite code');

    if (invite.expiresAt && new Date() > invite.expiresAt) {
      throw new ForbiddenException('Invite link has expired');
    }
    if (invite.maxUses !== null && invite.uses >= invite.maxUses) {
      throw new ForbiddenException('Invite link has reached its maximum uses');
    }

    const participant = await this.participantRepo.findOne({
      where: { guildId: invite.guildId, userId },
    });

    if (participant && participant.status === ParticipantStatus.BLOCKED) {
      throw new ForbiddenException('You are banned from this server');
    }

    await this.joinGuild(invite.guildId, userId);
    await this.inviteRepo.increment({ id: invite.id }, 'uses', 1);
  }

  async getInvites(guildId: string, userId: string) {
    await this.assertMembership(guildId, userId);
    return this.inviteRepo.find({
      where: { guildId },
      order: { createdAt: 'DESC' },
    });
  }

  async joinGuild(guildId: string, userId: string): Promise<void> {
    const guild = await this.guildRepo.findOne({ where: { id: guildId } });
    if (!guild) throw new NotFoundException('Guild not found');

    const existing = await this.participantRepo.findOne({
      where: { guildId, userId },
    });

    if (existing) {
      if (existing.status === ParticipantStatus.BLOCKED) {
        throw new ForbiddenException('You are banned from this server');
      }
      if (existing.status === ParticipantStatus.PARTICIPANT) {
        return;
      }
      existing.status = ParticipantStatus.PARTICIPANT;
      await this.participantRepo.save(existing);
      return;
    }

    const newParticipant = this.participantRepo.create({
      userId,
      guildId,
      status: ParticipantStatus.PARTICIPANT,
      permissions:
        GuildPermission.VIEW_CHANNELS | GuildPermission.SEND_MESSAGES,
    });
    await this.participantRepo.save(newParticipant);
  }

  async leaveGuild(guildId: string, userId: string): Promise<void> {
    const guild = await this.guildRepo.findOne({ where: { id: guildId } });
    if (!guild) throw new NotFoundException('Guild not found');

    if (guild.ownerId === userId) {
      throw new ForbiddenException(
        'Owner cannot leave the guild. Delete it instead.',
      );
    }

    await this.participantRepo.delete({ guildId, userId });
  }

  async getMembers(guildId: string, userId?: string) {
    if (userId) {
      await this.assertMembership(guildId, userId);
    }

    return this.participantRepo.find({
      where: { guildId, status: ParticipantStatus.PARTICIPANT },
      relations: { user: true },
      select: {
        id: true,
        userId: true,
        user: {
          id: true,
          username: true,
        },
      },
    });
  }

  async kickMember(
    guildId: string,
    targetId: string,
    executorId: string,
  ): Promise<void> {
    const guild = await this.assertOwnership(guildId, executorId);
    if (guild.ownerId === targetId) {
      throw new ForbiddenException('Cannot kick the guild owner');
    }
    await this.participantRepo.delete({ guildId, userId: targetId });
  }

  async banMember(
    guildId: string,
    targetId: string,
    executorId: string,
  ): Promise<void> {
    const guild = await this.assertOwnership(guildId, executorId);
    if (guild.ownerId === targetId) {
      throw new ForbiddenException('Cannot ban the guild owner');
    }

    let participant = await this.participantRepo.findOne({
      where: { guildId, userId: targetId },
    });

    if (participant) {
      participant.status = ParticipantStatus.BLOCKED;
    } else {
      participant = this.participantRepo.create({
        guildId,
        userId: targetId,
        status: ParticipantStatus.BLOCKED,
        permissions: 0,
      });
    }

    await this.participantRepo.save(participant);
  }

  async setChannelOverwrite(
    channelId: string,
    targetId: string,
    type: 'role' | 'user',
    allow: number,
    _deny?: number,
  ): Promise<ChannelParticipant> {
    let participant = await this.channelParticipantRepo.findOne({
      where: { channelId, userId: targetId },
    });

    if (participant) {
      participant.permissions = allow;
    } else {
      participant = this.channelParticipantRepo.create({
        channelId,
        userId: targetId,
        permissions: allow,
      });
    }

    return this.channelParticipantRepo.save(participant);
  }

  async deleteChannelOverwrite(
    channelId: string,
    targetId: string,
    _type: 'role' | 'user',
  ): Promise<void> {
    await this.channelParticipantRepo.delete({ channelId, userId: targetId });
  }

  async assertMembership(guildId: string, userId: string): Promise<void> {
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

  private async assertOwnership(
    guildId: string,
    userId: string,
  ): Promise<Guild> {
    const guild = await this.guildRepo.findOne({ where: { id: guildId } });
    if (!guild) throw new NotFoundException('Guild not found');
    if (guild.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can perform this action');
    }
    return guild;
  }

  async getMemberInfo(guildId: string, userId: string) {
    return this.participantRepo.findOne({
      where: { guildId, userId },
      relations: { user: true },
    });
  }
}
