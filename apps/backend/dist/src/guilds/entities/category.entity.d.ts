import { Guild } from './guild.entity';
import { Channel } from './channel.entity';
export declare class Category {
    id: string;
    name: string;
    guild: Guild;
    guildId: string;
    position: number;
    channels: Channel[];
}
