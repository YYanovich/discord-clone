"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsGuard = exports.RequirePermission = exports.REQUIRED_PERMISSION = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const permission_service_1 = require("../permission.service");
exports.REQUIRED_PERMISSION = 'required_permission';
const RequirePermission = (flag) => (0, common_1.SetMetadata)(exports.REQUIRED_PERMISSION, flag);
exports.RequirePermission = RequirePermission;
let PermissionsGuard = class PermissionsGuard {
    constructor(reflector, permissionsService) {
        this.reflector = reflector;
        this.permissionsService = permissionsService;
    }
    async canActivate(context) {
        const flag = this.reflector.get(exports.REQUIRED_PERMISSION, context.getHandler());
        if (!flag)
            return true;
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.userId;
        const guildId = request.params.guildId ?? request.params.id;
        const channelId = request.params.channelId;
        if (!userId || !guildId) {
            throw new common_1.ForbiddenException('Missing user or guild context');
        }
        const hasPermission = await this.permissionsService.hasPermission(userId, guildId, flag, channelId);
        if (!hasPermission) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        return true;
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        permission_service_1.PermissionsService])
], PermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map