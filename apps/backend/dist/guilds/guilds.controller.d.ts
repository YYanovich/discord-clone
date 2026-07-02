import { GuildsService } from './guilds.service';
import { CreateGuildDto } from './dto/create-guild.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
interface JwtPayload {
    userId: string;
    email: string;
    sessionId: string;
}
export declare class GuildsController {
    private readonly guildsService;
    constructor(guildsService: GuildsService);
    createGuild(dto: CreateGuildDto, user: JwtPayload): Promise<import("./entities/guild.entity").Guild>;
    getMyGuilds(user: JwtPayload): Promise<import("./entities/guild.entity").Guild[]>;
    joinByInvite(code: string, user: JwtPayload): Promise<void>;
    getGuild(guildId: string, user: JwtPayload): Promise<import("./entities/guild.entity").Guild>;
    getMembers(guildId: string, user: JwtPayload): Promise<import("./entities/membership.entity").Membership[]>;
    createChannel(guildId: string, dto: CreateChannelDto, user: JwtPayload): Promise<import("./entities/channel.entity").Channel>;
    createCategory(guildId: string, dto: CreateCategoryDto, user: JwtPayload): Promise<import("./entities/category.entity").Category>;
    createInvite(guildId: string, dto: CreateInviteDto, user: JwtPayload): Promise<import("./entities/invite.entity").Invite>;
    leaveGuild(guildId: string, user: JwtPayload): Promise<void>;
}
export {};
