import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../permission.service';
import { PermissionFlag } from '../entities/role.entity';

export const REQUIRED_PERMISSION = 'required_permission';

export const RequirePermission = (flag: PermissionFlag) =>
  SetMetadata(REQUIRED_PERMISSION, flag);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const flag = this.reflector.get<PermissionFlag>(
      REQUIRED_PERMISSION,
      context.getHandler(),
    );

    if (!flag) return true;

    const request = context.switchToHttp().getRequest();

    const userId = request.user?.userId;

    const guildId = request.params.guildId ?? request.params.id;
    const channelId = request.params.channelId;

    if (!userId || !guildId) {
      throw new ForbiddenException('Missing user or guild context');
    }

    const hasPermission = await this.permissionsService.hasPermission(
      userId,
      guildId,
      flag,
      channelId,
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
