import { Guild } from './guild.entity';
export declare enum PermissionFlag {
    VIEW_CHANNEL = 1,
    SEND_MESSAGES = 2,
    MANAGE_MESSAGES = 4,
    MANAGE_CHANNELS = 8,
    MANAGE_ROLES = 16,
    KICK_MEMBERS = 32,
    BAN_MEMBERS = 64,
    ADMINISTRATOR = 128
}
export declare class Role {
    id: string;
    name: string;
    permissions: number;
    guild: Guild;
    guildId: string;
    position: number;
}
