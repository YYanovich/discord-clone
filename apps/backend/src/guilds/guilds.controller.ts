import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GuildsService } from './guilds.service';
import { PermissionsService } from './permission.service';
import { GuildPermission } from './entities/guild-participant.entity';
import { CreateGuildDto } from './dto/create-guild.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateInviteDto } from './dto/create-invite.dto';

interface JwtPayload {
  userId: string;
  email: string;
  sessionId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('guilds')
export class GuildsController {
  constructor(
    private readonly guildsService: GuildsService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Post()
  createGuild(@Body() dto: CreateGuildDto, @CurrentUser() user: JwtPayload) {
    return this.guildsService.createGuild(dto.name, user.userId);
  }

  @Get()
  getMyGuilds(@CurrentUser() user: JwtPayload) {
    return this.guildsService.findUserGuilds(user.userId);
  }

  @Post('join/:code')
  joinByInvite(@Param('code') code: string, @CurrentUser() user: JwtPayload) {
    return this.guildsService.joinByInvite(code, user.userId);
  }

  @Get(':id')
  getGuild(@Param('id') guildId: string, @CurrentUser() user: JwtPayload) {
    return this.guildsService.findGuildById(guildId, user.userId);
  }

  @Get(':id/members')
  getMembers(@Param('id') guildId: string, @CurrentUser() user: JwtPayload) {
    return this.guildsService.getMembers(guildId, user.userId);
  }

  @Get(':id/my-permissions')
  async getMyPermissions(
    @Param('id') guildId: string,
    @Query('channelId') channelId: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    const permissions = await this.permissionsService.getMyGuildPermissions(
      user.userId,
      guildId,
    );
    return { permissions };
  }

  @Post(':id/channels')
  async createChannel(
    @Param('id') guildId: string,
    @Body() dto: CreateChannelDto,
    @CurrentUser() user: JwtPayload,
  ) {
    //check permission by permission.service
    await this.permissionsService.checkGuildPermission(
      user.userId,
      guildId,
      GuildPermission.CREATE_CHANNEL,
    );
    return this.guildsService.createChannel(guildId, user.userId, dto);
  }

  @Post(':id/categories')
  async createCategory(
    @Param('id') guildId: string,
    @Body() dto: CreateCategoryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.permissionsService.checkGuildPermission(
      user.userId,
      guildId,
      GuildPermission.CREATE_CHANNEL,
    );
    return this.guildsService.createCategory(guildId, user.userId, dto.name);
  }

  @Post(':id/invites')
  async createInvite(
    @Param('id') guildId: string,
    @Body() dto: CreateInviteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.permissionsService.checkGuildPermission(
      user.userId,
      guildId,
      GuildPermission.INVITE_USER,
    );
    return this.guildsService.createInvite(guildId, user.userId, dto);
  }

  @Get(':id/invites')
  async getInvites(
    @Param('id') guildId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.permissionsService.checkGuildPermission(
      user.userId,
      guildId,
      GuildPermission.INVITE_USER,
    );
    return this.guildsService.getInvites(guildId, user.userId);
  }

  @Delete(':id/leave')
  leaveGuild(@Param('id') guildId: string, @CurrentUser() user: JwtPayload) {
    return this.guildsService.leaveGuild(guildId, user.userId);
  }

  @Delete(':id/members/:userId/kick')
  async kickMember(
    @Param('id') guildId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.permissionsService.checkGuildPermission(
      user.userId,
      guildId,
      GuildPermission.DELETE_USER,
    );
    return this.guildsService.kickMember(guildId, targetUserId, user.userId);
  }

  @Post(':id/members/:userId/ban')
  async banMember(
    @Param('id') guildId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.permissionsService.checkGuildPermission(
      user.userId,
      guildId,
      GuildPermission.DELETE_USER,
    );
    return this.guildsService.banMember(guildId, targetUserId, user.userId);
  }

  @Put(':id/channels/:channelId/permissions/:targetId')
  async setChannelOverwrite(
    @Param('id') guildId: string,
    @Param('channelId') channelId: string,
    @Param('targetId') targetId: string,
    @Body() dto: { allow: number; deny: number; type: 'role' | 'user' },
    @CurrentUser() user: JwtPayload,
  ) {
    await this.permissionsService.checkGuildPermission(
      user.userId,
      guildId,
      GuildPermission.EDIT_GUILD,
    );
    return this.guildsService.setChannelOverwrite(
      channelId,
      targetId,
      dto.type,
      dto.allow,
      dto.deny,
    );
  }

  @Delete(':id/channels/:channelId/permissions/:targetId')
  async deleteChannelOverwrite(
    @Param('id') guildId: string,
    @Param('channelId') channelId: string,
    @Param('targetId') targetId: string,
    @Body() dto: { type: 'role' | 'user' },
    @CurrentUser() user: JwtPayload,
  ) {
    await this.permissionsService.checkGuildPermission(
      user.userId,
      guildId,
      GuildPermission.EDIT_GUILD,
    );
    return this.guildsService.deleteChannelOverwrite(
      channelId,
      targetId,
      dto.type,
    );
  }
}
