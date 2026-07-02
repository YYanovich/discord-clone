import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
  ) {}

  async create(data: {
    content: string;
    channelId: string;
    authorId: string;
  }): Promise<Message> {
    const message = this.messageRepo.create(data);
    return this.messageRepo.save(message);
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
    await this.messageRepo.update(
      { id: messageId, authorId: userId },
      { isDeleted: true },
    );
  }

  async edit(
    messageId: string,
    userId: string,
    content: string,
  ): Promise<void> {
    await this.messageRepo.update(
      { id: messageId, authorId: userId },
      { content, editedAt: new Date() },
    );
  }
}
