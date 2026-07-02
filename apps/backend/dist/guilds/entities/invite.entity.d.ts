import { Guild } from './guild.entity';
import { User } from '../../users/entities/user.entity';
export declare class Invite {
    id: string;
    code: string;
    guild: Guild;
    guildId: string;
    createdBy: User;
    createdById: string;
    maxUses: number | null;
    uses: number;
    expiresAt: Date | null;
    createdAt: Date;
}
