import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../permission.service';
import { PermissionFlag } from '../entities/role.entity';
export declare const REQUIRED_PERMISSION = "required_permission";
export declare const RequirePermission: (flag: PermissionFlag) => import("@nestjs/common").CustomDecorator<string>;
export declare class PermissionsGuard implements CanActivate {
    private reflector;
    private permissionsService;
    constructor(reflector: Reflector, permissionsService: PermissionsService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
