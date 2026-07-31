import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { OutboxService } from '../outbox/outbox.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    private outboxService: OutboxService,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async create(data: {
    content: string;
    channelId: string;
    authorId: string;
    guildId: string;
  }): Promise<Message> {
    return this.dataSource.transaction(async (manager) => {
      const message = manager.create(Message, {
        content: data.content,
        channelId: data.channelId,
        authorId: data.authorId,
      });
      const saved = await manager.save(message);

      await this.outboxService.write(
        'messages.created',
        {
          messageId: saved.id,
          content: saved.content,
          channelId: saved.channelId,
          guildId: data.guildId,
          authorId: saved.authorId,
          createdAt: saved.createdAt.toISOString(),
        },
        manager,
      );

      return saved;
    });
  }

  async findByChannel(
    channelId: string,
    before?: string,
    limit = 50,
  ): Promise<Message[]> {
    const query = this.messageRepo
      .createQueryBuilder('message')
      .where('message.channelId = :channelId', { channelId })
      .andWhere('message.isDeleted = false')
      .orderBy('message.createdAt', 'DESC')
      .limit(limit);

    if (before) {
      query.andWhere('message.createdAt < :before', { before });
    }

    const messages = await query.getMany();
    return messages.reverse();
  }

  async softDelete(messageId: string, userId: string): Promise<void> {
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');
    if (message.authorId !== userId)
      throw new ForbiddenException('Not allowed');

    message.isDeleted = true;
    await this.messageRepo.save(message);

    try {
      await this.outboxService.write('messages.deleted', {
        messageId: message.id,
        channelId: message.channelId,
      });
    } catch (err) {
      console.error('Outbox write failed, but DB updated:', err);
    }
  }

  async edit(
    messageId: string,
    userId: string,
    content: string,
  ): Promise<void> {
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');
    if (message.authorId !== userId)
      throw new ForbiddenException('Not allowed');

    message.content = content;
    message.editedAt = new Date();
    await this.messageRepo.save(message);

    try {
      await this.outboxService.write('messages.updated', {
        messageId: message.id,
        content: message.content,
      });
    } catch (err) {
      console.error('Outbox write failed, but DB updated:', err);
    }
  }
}
