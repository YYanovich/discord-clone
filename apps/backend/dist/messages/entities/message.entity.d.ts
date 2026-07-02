import { User } from '../../users/entities/user.entity';
import { Channel } from '../../guilds/entities/channel.entity';
export declare class Message {
    id: string;
    content: string;
    channel: Channel;
    channelId: string;
    author: User;
    authorId: string;
    isDeleted: boolean;
    editedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
