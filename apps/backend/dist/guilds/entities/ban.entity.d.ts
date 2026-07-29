import { Guild } from './guild.entity';
import { User } from '../../users/entities/user.entity';
export declare class Ban {
    id: string;
    guild: Guild;
    guildId: string;
    user: User;
    userId: string;
    reason: string | null;
    createdAt: Date;
}
