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
    private readonly messageRepo: Repository<Message>,
    private readonly outboxService: OutboxService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
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
    await this.dataSource.transaction(async (manager) => {
      const messageRepo = manager.getRepository(Message);
      const message = await messageRepo.findOne({
        where: { id: messageId },
      });

      if (!message) throw new NotFoundException('Message not found');
      if (message.authorId !== userId)
        throw new ForbiddenException('Not allowed');

      message.isDeleted = true;
      await messageRepo.save(message);

      await this.outboxService.write(
        'messages.deleted',
        {
          messageId: message.id,
          channelId: message.channelId,
        },
        manager,
      );
    });
  }

  async edit(
    messageId: string,
    userId: string,
    content: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const messageRepo = manager.getRepository(Message);
      const message = await messageRepo.findOne({
        where: { id: messageId },
      });

      if (!message) throw new NotFoundException('Message not found');
      if (message.authorId !== userId)
        throw new ForbiddenException('Not allowed');

      message.content = content;
      message.editedAt = new Date();
      await messageRepo.save(message);

      await this.outboxService.write(
        'messages.updated',
        {
          messageId: message.id,
          content: message.content,
        },
        manager,
      );
    });
  }

  //search messages in archive
  async searchArchive(params: {
    query: string;
    guildId: string;
    channelId?: string;
    before?: string;
  }) {
    //activate pg_trgm

    const qb = this.messageRepo
      .createQueryBuilder('m')
      .innerJoin('channels', 'ch', 'ch.id = m.channelId')
      .where('ch.guild_id = :guildId', { guildId: params.guildId })
      .andWhere('m.isDeleted = false')
      .andWhere('similarity(m.content, :query) > 0.1', { query: params.query })
      .orderBy('similarity(m.content, :query)', 'DESC')
      .limit(20);

    if (params.channelId) {
      qb.andWhere('m.channelId = :channelId', { channelId: params.channelId });
    }
    if (params.before) {
      qb.andWhere('m.createdAt < :before', { before: params.before });
    }

    const messages = await qb.getMany();
    return { hits: messages, total: messages.length, isArchive: true };
  }

  async findAll(): Promise<Message[]> {
    return this.messageRepo.find({
      relations: {
        channel: true,
      },
      where: { isDeleted: false },
      order: { createdAt: 'ASC' },
      take: 10000,
    });
  }
  async findAllWithGuild(): Promise<Message[]> {
    return this.messageRepo.find({
      where: { isDeleted: false },
      relations: { channel: true },
      order: { createdAt: 'ASC' },
      take: 50000,
    });
  }
}
