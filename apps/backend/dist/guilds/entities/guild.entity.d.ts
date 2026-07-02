import { User } from '../../users/entities/user.entity';
import { Category } from './category.entity';
import { Channel } from './channel.entity';
import { Membership } from './membership.entity';
import { Invite } from './invite.entity';
export declare class Guild {
    id: string;
    name: string;
    owner: User;
    ownerId: string;
    iconUrl: string | null;
    categories: Category[];
    channels: Channel[];
    memberships: Membership[];
    invites: Invite[];
    createdAt: Date;
}
