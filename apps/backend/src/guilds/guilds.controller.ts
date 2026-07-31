import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GuildsService } from './guilds.service';
import { CreateGuildDto } from './dto/create-guild.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
import {
  PermissionsGuard,
  RequirePermission,
} from './guards/permissions.guard';
import { PermissionFlag } from './entities/role.entity';
import { PermissionsService } from './permission.service';

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

  @Post(':id/channels')
  @UseGuards(PermissionsGuard)
  @RequirePermission(PermissionFlag.MANAGE_CHANNELS)
  createChannel(
    @Param('id') guildId: string,
    @Body() dto: CreateChannelDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.guildsService.createChannel(guildId, user.userId, dto);
  }

  @Post(':id/categories')
  createCategory(
    @Param('id') guildId: string,
    @Body() dto: CreateCategoryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.guildsService.createCategory(guildId, user.userId, dto.name);
  }

  @Get(':id/invites')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(PermissionFlag.MANAGE_CHANNELS)
  getInvites(@Param('id') guildId: string, @CurrentUser() user: JwtPayload) {
    return this.guildsService.getInvites(guildId, user.userId);
  }
  
  @Post(':id/invites')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(PermissionFlag.MANAGE_CHANNELS)
  createInvite(
    @Param('id') guildId: string,
    @Body() dto: CreateInviteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.guildsService.createInvite(guildId, user.userId, dto);
  }

  @Delete(':id/leave')
  leaveGuild(@Param('id') guildId: string, @CurrentUser() user: JwtPayload) {
    return this.guildsService.leaveGuild(guildId, user.userId);
  }

  @Delete(':id/members/:userId/kick')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(PermissionFlag.KICK_MEMBERS)
  kickMember(
    @Param('id') guildId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.guildsService.kickMember(guildId, targetUserId, user.userId);
  }

  @Post(':id/members/:userId/ban')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(PermissionFlag.BAN_MEMBERS)
  banMember(
    @Param('id') guildId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.guildsService.banMember(guildId, targetUserId, user.userId);
  }

  @Put(':id/channels/:channelId/permissions/:targetId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(PermissionFlag.MANAGE_CHANNELS)
  async setChannelOverwrite(
    @Param('id') guildId: string,
    @Param('channelId') channelId: string,
    @Param('targetId') targetId: string,
    @Body() dto: { allow: number; deny: number; type: 'role' | 'user' },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.guildsService.setChannelOverwrite(
      channelId,
      targetId,
      dto.type,
      dto.allow,
      dto.deny,
    );
  }

  @Delete(':id/channels/:channelId/permissions/:targetId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(PermissionFlag.MANAGE_CHANNELS)
  async deleteChannelOverwrite(
    @Param('channelId') channelId: string,
    @Param('targetId') targetId: string,
    @Body() dto: { type: 'role' | 'user' },
  ) {
    return this.guildsService.deleteChannelOverwrite(
      channelId,
      targetId,
      dto.type,
    );
  }
  @Get(':id/my-permissions')
  @UseGuards(JwtAuthGuard)
  async getMyPermissions(
    @Param('id') guildId: string,
    @Query('channelId') channelId: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    const permissions = await this.permissionsService.computePermissions(
      user.userId,
      guildId,
      channelId,
    );
    return { permissions };
  }
}
