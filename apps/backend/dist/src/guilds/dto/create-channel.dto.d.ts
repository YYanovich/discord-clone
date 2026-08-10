import { ChannelType } from '../entities/channel.entity';
export declare class CreateChannelDto {
    name: string;
    type: ChannelType;
    categoryId?: string;
}
