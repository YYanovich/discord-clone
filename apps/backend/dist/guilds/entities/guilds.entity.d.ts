import { User } from '../../users/entities/user.entity';
import { Channel } from './channel.entity';
import { Membership } from './membership.entity';
export declare class Guild {
    id: string;
    name: String;
    owner: User;
    ownerId: string;
    iconUrl: string | null;
    channels: Channel[];
    memberships: Membership[];
    createdAt: Date;
}
