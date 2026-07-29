import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxService } from './outbox.service';
import { OutboxEvent } from './entities/outbox.entity';
import { KafkaModule } from '../kafka/kafka.module';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([OutboxEvent]), KafkaModule],
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule {}