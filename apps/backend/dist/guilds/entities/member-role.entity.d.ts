import { User } from '../../users/entities/user.entity';
import { Role } from './role.entity';
import { Guild } from './guild.entity';
export declare class MemberRole {
    id: string;
    user: User;
    userId: string;
    role: Role;
    roleId: string;
    guild: Guild;
    guildId: string;
}
