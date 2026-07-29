import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PermissionsGuard, RequirePermission } from './guards/permissions.guard';
import { PermissionFlag } from './entities/role.entity';
import { GuildsService } from './guilds.service';

interface JwtPayload { userId: string }

@UseGuards(JwtAuthGuard)
@Controller('guilds/:id/roles')
export class RolesController {
  constructor(private readonly guildsService: GuildsService) {}

  @Get()
  getRoles(@Param('id') guildId: string) {
    return this.guildsService.getRoles(guildId);
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermission(PermissionFlag.MANAGE_ROLES)
  createRole(
    @Param('id') guildId: string,
    @Body() dto: { name: string; permissions: number },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.guildsService.createRole(guildId, user.userId, dto);
  }

  @Patch(':roleId')
  @UseGuards(PermissionsGuard)
  @RequirePermission(PermissionFlag.MANAGE_ROLES)
  updateRole(
    @Param('id') guildId: string,
    @Param('roleId') roleId: string,
    @Body() dto: { name?: string; permissions?: number },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.guildsService.updateRole(guildId, roleId, user.userId, dto);
  }

  @Delete(':roleId')
  @UseGuards(PermissionsGuard)
  @RequirePermission(PermissionFlag.MANAGE_ROLES)
  deleteRole(
    @Param('id') guildId: string,
    @Param('roleId') roleId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.guildsService.deleteRole(guildId, roleId, user.userId);
  }

  @Post(':roleId/members/:userId')
  @UseGuards(PermissionsGuard)
  @RequirePermission(PermissionFlag.MANAGE_ROLES)
  assignRole(
    @Param('id') guildId: string,
    @Param('roleId') roleId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.guildsService.assignRole(guildId, roleId, targetUserId);
  }

  @Delete(':roleId/members/:userId')
  @UseGuards(PermissionsGuard)
  @RequirePermission(PermissionFlag.MANAGE_ROLES)
  removeRole(
    @Param('id') guildId: string,
    @Param('roleId') roleId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.guildsService.removeRole(guildId, roleId, targetUserId);
  }
}