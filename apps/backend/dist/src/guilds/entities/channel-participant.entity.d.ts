import { Channel } from './channel.entity';
import { ParticipantStatus } from './participant-status.enum';
export declare enum ChannelPermission {
    READ = 1,
    WRITE = 2,
    INVITE = 4,
    DELETE = 8,
    MANAGE = 16
}
export declare class ChannelParticipant {
    id: string;
    channel: Channel;
    channelId: string;
    userId: string;
    inviterId: string | null;
    permissions: number;
    status: ParticipantStatus;
}
