import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GuildsService } from './guilds.service';
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
  constructor(private readonly guildsService: GuildsService) {}

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

  @Post(':id/invite')
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
}
