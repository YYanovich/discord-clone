import { Repository } from 'typeorm';
import { Role, PermissionFlag } from './entities/role.entity';
import { MemberRole } from './entities/member-role.entity';
import { ChannelOverwrite } from './entities/channel-overwrite.entity';
import { Guild } from './entities/guild.entity';
export declare class PermissionsService {
    private roleRepo;
    private memberRoleRepo;
    private overwriteRepo;
    private guildRepo;
    constructor(roleRepo: Repository<Role>, memberRoleRepo: Repository<MemberRole>, overwriteRepo: Repository<ChannelOverwrite>, guildRepo: Repository<Guild>);
    computePermissions(userId: string, guildId: string, channelId?: string): Promise<number>;
    hasPermission(userId: string, guildId: string, flag: PermissionFlag, channelId?: string): Promise<boolean>;
}
