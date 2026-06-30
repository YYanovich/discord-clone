import { Guild } from './guild.entity';
import { Category } from './category.entity';
export declare enum ChannelType {
    TEXT = "TEXT",
    VOICE = "VOICE"
}
export declare class Channel {
    id: string;
    name: string;
    type: ChannelType;
    guild: Guild;
    category: Category | null;
    categoryId: string | null;
    position: number;
}
