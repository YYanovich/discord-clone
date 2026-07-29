import { Channel } from './channel.entity';
export declare class ChannelOverwrite {
    id: string;
    channel: Channel;
    channelId: string;
    roleId: string | null;
    userId: string | null;
    allow: number;
    deny: number;
}
