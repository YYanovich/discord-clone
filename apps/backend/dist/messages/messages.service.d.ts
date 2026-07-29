import { DataSource, Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { OutboxService } from '../outbox/outbox.service';
export declare class MessagesService {
    private messageRepo;
    private outboxService;
    private dataSource;
    constructor(messageRepo: Repository<Message>, outboxService: OutboxService, dataSource: DataSource);
    create(data: {
        content: string;
        channelId: string;
        authorId: string;
        guildId: string;
    }): Promise<Message>;
    findByChannel(channelId: string, before?: string, limit?: number): Promise<Message[]>;
    softDelete(messageId: string, userId: string): Promise<void>;
    edit(messageId: string, userId: string, content: string): Promise<void>;
}
