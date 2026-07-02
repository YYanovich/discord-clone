import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
export declare class MessagesService {
    private messageRepo;
    constructor(messageRepo: Repository<Message>);
    create(data: {
        content: string;
        channelId: string;
        authorId: string;
    }): Promise<Message>;
    findByChannel(channelId: string, before?: string, limit?: number): Promise<Message[]>;
    softDelete(messageId: string, userId: string): Promise<void>;
    edit(messageId: string, userId: string, content: string): Promise<void>;
}
