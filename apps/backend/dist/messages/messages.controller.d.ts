import { MessagesService } from './messages.service';
interface JwtPayload {
    userId: string;
}
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    edit(messageId: string, content: string, user: JwtPayload): Promise<void>;
    delete(messageId: string, user: JwtPayload): Promise<void>;
}
export {};
