import { Repository } from 'typeorm';
import { Guild } from './entities/guild.entity';
import { Category } from './entities/category.entity';
import { Channel } from './entities/channel.entity';
import { Membership } from './entities/membership.entity';
import { Invite } from './entities/invite.entity';
import { CreateChannelDto } from './dto/create-channel.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
export declare class GuildsService {
    private guildRepo;
    private categoryRepo;
    private channelRepo;
    private membershipRepo;
    private inviteRepo;
    constructor(guildRepo: Repository<Guild>, categoryRepo: Repository<Category>, channelRepo: Repository<Channel>, membershipRepo: Repository<Membership>, inviteRepo: Repository<Invite>);
    createGuild(name: string, ownerId: string): Promise<Guild>;
    findUserGuilds(userId: string): Promise<Guild[]>;
    findGuildById(guildId: string, userId: string): Promise<Guild>;
    createChannel(guildId: string, userId: string, dto: CreateChannelDto): Promise<Channel>;
    createCategory(guildId: string, userId: string, name: string): Promise<Category>;
    createInvite(guildId: string, userId: string, dto?: CreateInviteDto): Promise<Invite>;
    joinByInvite(code: string, userId: string): Promise<void>;
    joinGuild(guildId: string, userId: string): Promise<void>;
    leaveGuild(guildId: string, userId: string): Promise<void>;
    getMembers(guildId: string, userId: string): Promise<Membership[]>;
    private assertMembership;
    private assertOwnership;
}
