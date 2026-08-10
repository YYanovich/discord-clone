import { MessagesService } from './messages.service';
import { EventsGateway } from '../events/events.gateway';
interface JwtPayload {
    userId: string;
}
export declare class MessagesController {
    private readonly messagesService;
    private readonly eventsGateway;
    constructor(messagesService: MessagesService, eventsGateway: EventsGateway);
    edit(messageId: string, content: string, guildId: string, user: JwtPayload): Promise<{
        ok: boolean;
    }>;
    delete(messageId: string, guildId: string, user: JwtPayload): Promise<{
        ok: boolean;
    }>;
}
export {};
