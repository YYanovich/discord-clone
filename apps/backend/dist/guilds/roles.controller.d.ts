import { GuildsService } from './guilds.service';
interface JwtPayload {
    userId: string;
}
export declare class RolesController {
    private readonly guildsService;
    constructor(guildsService: GuildsService);
    getRoles(guildId: string): Promise<import("./entities/role.entity").Role[]>;
    createRole(guildId: string, dto: {
        name: string;
        permissions: number;
    }, user: JwtPayload): Promise<import("./entities/role.entity").Role>;
    updateRole(guildId: string, roleId: string, dto: {
        name?: string;
        permissions?: number;
    }, user: JwtPayload): Promise<import("./entities/role.entity").Role>;
    deleteRole(guildId: string, roleId: string, user: JwtPayload): Promise<void>;
    assignRole(guildId: string, roleId: string, targetUserId: string): Promise<void>;
    removeRole(guildId: string, roleId: string, targetUserId: string): Promise<void>;
}
export {};
