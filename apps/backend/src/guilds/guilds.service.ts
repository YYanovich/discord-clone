import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Guild } from './entities/guild.entity';
import { Category } from './entities/category.entity';
import { Channel, ChannelType } from './entities/channel.entity';
import { Membership } from './entities/membership.entity';
import { Invite } from './entities/invite.entity';
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
    @InjectRepository(Membership)
    private membershipRepo: Repository<Membership>,
    @InjectRepository(Invite)
    private inviteRepo: Repository<Invite>,
  ) {}

  async createGuild(name: string, ownerId: string): Promise<Guild> {
    const guild = this.guildRepo.create({ name, ownerId });
    const saved = await this.guildRepo.save(guild);

    const membership = this.membershipRepo.create({
      userId: ownerId,
      guildId: saved.id,
    });
    await this.membershipRepo.save(membership);

    const defaultChannel = this.channelRepo.create({
      name: 'general',
      type: ChannelType.TEXT,
      guildId: saved.id,
      categoryId: null,
    });
    await this.channelRepo.save(defaultChannel);
    return saved;
  }

  async findUserGuilds(userId: string): Promise<Guild[]> {
    const membership = await this.membershipRepo.find({
      where: { userId },
      relations: { guild: true },
    });
    return membership.map((m) => m.guild);
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
    const guild = await this.assertOwnership(guildId, userId);

    const channel = this.channelRepo.create({
      name: dto.name,
      type: dto.type,
      guildId: guild.id,
      categoryId: dto.categoryId ?? null,
    });
    return this.channelRepo.save(channel);
  }

  async createCategory(
    guildId: string,
    userId: string,
    name: string,
  ): Promise<Category> {
    const guild = await this.assertOwnership(guildId, userId);

    const category = this.categoryRepo.create({
      name,
      guildId: guild.id,
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
    const invite = await this.inviteRepo.findOne({
      where: { code },
      relations: { guild: true },
    });

    if (!invite) throw new NotFoundException('Invalid invite code');

    if (invite.expiresAt && new Date() > invite.expiresAt) {
      throw new ForbiddenException('Invite link has expired');
    }

    if (invite.maxUses !== null && invite.uses >= invite.maxUses) {
      throw new ForbiddenException('Invite link has reached its maximum uses');
    }

    await this.joinGuild(invite.guildId, userId);

    await this.inviteRepo.update({ id: invite.id }, { uses: invite.uses + 1 });
  }

  async joinGuild(guildId: string, userId: string): Promise<void> {
    const guild = await this.guildRepo.findOne({ where: { id: guildId } });
    if (!guild) throw new NotFoundException('Guild not found');

    const existing = await this.membershipRepo.findOne({
      where: { guildId, userId },
    });
    if (existing) return;

    const membership = this.membershipRepo.create({ userId, guildId });
    await this.membershipRepo.save(membership);
  }

  async leaveGuild(guildId: string, userId: string): Promise<void> {
    const guild = await this.guildRepo.findOne({ where: { id: guildId } });
    if (!guild) throw new NotFoundException('Guild not found');

    if (guild.ownerId === userId) {
      throw new ForbiddenException(
        'Owner cannot leave the guild. Delete it instead.',
      );
    }

    await this.membershipRepo.delete({ guildId, userId });
  }

  async getMembers(guildId: string, userId: string) {
    await this.assertMembership(guildId, userId);

    return this.membershipRepo.find({
      where: { guildId },
      relations: { user: true },
      select: {
        id: true,
        joinedAt: true,
        user: {
          id: true,
          username: true,
        },
      },
    });
  }

  private async assertMembership(
    guildId: string,
    userId: string,
  ): Promise<void> {
    const membership = await this.membershipRepo.findOne({
      where: { guildId, userId },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this guild');
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
}
