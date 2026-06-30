import { User } from '../../users/entities/user.entity';
import { Guild } from './guild.entity';
export declare class Membership {
    id: string;
    user: User;
    userId: string;
    guild: Guild;
    guildId: string;
    joinedAt: Date;
}
