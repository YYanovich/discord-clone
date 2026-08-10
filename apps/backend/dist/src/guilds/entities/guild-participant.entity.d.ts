import { Guild } from './guild.entity';
import { User } from '../../users/entities/user.entity';
export declare enum ParticipantStatus {
    WAITING_ADMIN_APPROVE = "WAITING_ADMIN_APPROVE",
    ADMIN_REJECTED = "ADMIN_REJECTED",
    PARTICIPANT = "PARTICIPANT",
    WAITING_USER_ACCEPTANCE = "WAITING_USER_ACCEPTANCE",
    USER_REJECTED_INVITE = "USER_REJECTED_INVITE",
    BLOCKED = "BLOCKED"
}
export declare enum GuildPermission {
    VIEW_CHANNELS = 1,
    SEND_MESSAGES = 2,
    CREATE_CHANNEL = 4,
    INVITE_USER = 8,
    DELETE_USER = 16,
    EDIT_GUILD = 32,
    ADMINISTRATOR = 64
}
export declare class GuildParticipant {
    id: string;
    guild: Guild;
    guildId: string;
    user: User;
    userId: string;
    inviterId: string | null;
    permissions: number;
    status: ParticipantStatus;
    joinedAt: Date;
}
