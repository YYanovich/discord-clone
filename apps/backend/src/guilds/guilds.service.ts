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
import { Role, PermissionFlag } from './entities/role.entity';
import { MemberRole } from './entities/member-role.entity';
import { Ban } from './entities/ban.entity';
import { ChannelOverwrite } from './entities/channel-overwrite.entity';

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
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(MemberRole)
    private readonly memberRoleRepo: Repository<MemberRole>,
    @InjectRepository(Ban)
    private readonly banRepo: Repository<Ban>,
    @InjectRepository(ChannelOverwrite)
    private readonly overwriteRepo: Repository<ChannelOverwrite>,
  ) {}

  async createGuild(name: string, ownerId: string): Promise<Guild> {
    const guild = this.guildRepo.create({ name, ownerId });
    const saved = await this.guildRepo.save(guild);

    const everyoneRole = this.roleRepo.create({
      name: '@everyone',
      guildId: saved.id,
      position: 0,
      permissions: PermissionFlag.VIEW_CHANNEL | PermissionFlag.SEND_MESSAGES,
    });
    await this.roleRepo.save(everyoneRole);

    const membership = this.membershipRepo.create({
      userId: ownerId,
      guildId: saved.id,
    });
    await this.membershipRepo.save(membership);

    const memberRole = this.memberRoleRepo.create({
      userId: ownerId,
      roleId: everyoneRole.id,
      guildId: saved.id,
    });
    await this.memberRoleRepo.save(memberRole);

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
    const invite = await this.inviteRepo.findOne({ where: { code } });
    if (!invite) throw new NotFoundException('Invalid invite code');

    if (invite.expiresAt && new Date() > invite.expiresAt) {
      throw new ForbiddenException('Invite link has expired');
    }
    if (invite.maxUses !== null && invite.uses >= invite.maxUses) {
      throw new ForbiddenException('Invite link has reached its maximum uses');
    }

    const ban = await this.banRepo.findOne({
      where: { guildId: invite.guildId, userId },
    });
    if (ban) throw new ForbiddenException('You are banned from this server');

    await this.joinGuild(invite.guildId, userId);
    await this.inviteRepo.update({ id: invite.id }, { uses: invite.uses + 1 });
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

    const existing = await this.membershipRepo.findOne({
      where: { guildId, userId },
    });
    if (existing) return;

    const membership = this.membershipRepo.create({ userId, guildId });
    await this.membershipRepo.save(membership);

    const everyoneRole = await this.roleRepo.findOne({
      where: { guildId, name: '@everyone' },
    });
    if (everyoneRole) {
      const memberRole = this.memberRoleRepo.create({
        userId,
        roleId: everyoneRole.id,
        guildId,
      });
      await this.memberRoleRepo.save(memberRole);
    }
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

  async getMembers(guildId: string, userId?: string) {
    if (userId) {
      await this.assertMembership(guildId, userId);
    }

    return this.membershipRepo.find({
      where: { guildId },
      relations: { user: true },
      select: {
        id: true,
        userId: true,
        joinedAt: true,
        user: {
          id: true,
          username: true,
        },
      },
    });
  }

  async assertMembership(guildId: string, userId: string): Promise<void> {
    const membership = await this.membershipRepo.findOne({
      where: { guildId, userId },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this guild');
    }
  }
  async getRoles(guildId: string): Promise<Role[]> {
    return this.roleRepo.find({
      where: { guildId },
      order: { position: 'DESC' },
    });
  }

  async createRole(
    guildId: string,
    userId: string,
    dto: { name: string; permissions: number },
  ): Promise<Role> {
    await this.assertOwnership(guildId, userId);
    const role = this.roleRepo.create({ ...dto, guildId });
    return this.roleRepo.save(role);
  }

  async updateRole(
    guildId: string,
    roleId: string,
    userId: string,
    dto: { name?: string; permissions?: number },
  ): Promise<Role> {
    await this.assertOwnership(guildId, userId);
    await this.roleRepo.update({ id: roleId, guildId }, dto);
    return this.roleRepo.findOne({ where: { id: roleId } }) as Promise<Role>;
  }

  async deleteRole(
    guildId: string,
    roleId: string,
    userId: string,
  ): Promise<void> {
    await this.assertOwnership(guildId, userId);
    await this.roleRepo.delete({ id: roleId, guildId });
  }

  async assignRole(
    guildId: string,
    roleId: string,
    targetUserId: string,
  ): Promise<void> {
    const existing = await this.memberRoleRepo.findOne({
      where: { userId: targetUserId, roleId, guildId },
    });
    if (existing) return;
    await this.memberRoleRepo.save(
      this.memberRoleRepo.create({ userId: targetUserId, roleId, guildId }),
    );
  }

  async removeRole(
    guildId: string,
    roleId: string,
    targetUserId: string,
  ): Promise<void> {
    await this.memberRoleRepo.delete({ userId: targetUserId, roleId, guildId });
  }

  async kickMember(
    guildId: string,
    targetId: string,
    executorId: string,
  ): Promise<void> {
    const guild = await this.guildRepo.findOne({ where: { id: guildId } });
    if (guild?.ownerId === targetId) {
      throw new ForbiddenException('Cannot kick the guild owner');
    }
    await this.membershipRepo.delete({ guildId, userId: targetId });
  }

  async banMember(
    guildId: string,
    targetId: string,
    executorId: string,
  ): Promise<void> {
    const guild = await this.guildRepo.findOne({ where: { id: guildId } });
    if (guild?.ownerId === targetId) {
      throw new ForbiddenException('Cannot ban the guild owner');
    }
    await this.membershipRepo.delete({ guildId, userId: targetId });
    const ban = this.banRepo.create({ guildId, userId: targetId });
    await this.banRepo.save(ban);
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
  async setChannelOverwrite(
    channelId: string,
    targetId: string,
    type: 'role' | 'user',
    allow: number,
    deny: number,
  ): Promise<ChannelOverwrite> {
    const existing = await this.overwriteRepo.findOne({
      where:
        type === 'role'
          ? { channelId, roleId: targetId }
          : { channelId, userId: targetId },
    });

    if (existing) {
      await this.overwriteRepo.update(existing.id, { allow, deny });
      return this.overwriteRepo.findOne({
        where: { id: existing.id },
      }) as Promise<ChannelOverwrite>;
    }

    const overwrite = this.overwriteRepo.create({
      channelId,
      allow,
      deny,
      roleId: type === 'role' ? targetId : null,
      userId: type === 'user' ? targetId : null,
    });
    return this.overwriteRepo.save(overwrite);
  }

  async deleteChannelOverwrite(
    channelId: string,
    targetId: string,
    type: 'role' | 'user',
  ): Promise<void> {
    await this.overwriteRepo.delete(
      type === 'role'
        ? { channelId, roleId: targetId }
        : { channelId, userId: targetId },
    );
  }
}
