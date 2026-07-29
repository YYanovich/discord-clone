import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { Message } from './entities/message.entity';
import { MessagesController } from './messages.controller';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [TypeOrmModule.forFeature([Message]), OutboxModule],
  providers: [MessagesService],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule {}
