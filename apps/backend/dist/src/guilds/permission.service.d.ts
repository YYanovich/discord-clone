import type { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import { GuildParticipant, GuildPermission } from './entities/guild-participant.entity';
import { ChannelPermission } from './entities/channel-participant.entity';
export declare class PermissionsService {
    private readonly dataSource;
    private readonly participantRepo;
    constructor(dataSource: DataSource, participantRepo: Repository<GuildParticipant>);
    checkGuildMembership(guildId: string, userId: string): Promise<void>;
    hasPermission(userId: string, guildId: string, flag: GuildPermission): Promise<boolean>;
    checkGuildPermission(userId: string, guildId: string, flag: GuildPermission): Promise<void>;
    checkChannelPermission(userId: string, channelId: string, flag: ChannelPermission): Promise<void>;
    getMyGuildPermissions(userId: string, guildId: string): Promise<number>;
}
