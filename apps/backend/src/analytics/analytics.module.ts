import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClickHouseService } from './clickhouse.service';
import { AnalyticsConsumer } from './analytics.consumer';

@Module({
  imports: [ConfigModule],
  providers: [ClickHouseService, AnalyticsConsumer],
  exports: [ClickHouseService],
})
export class AnalyticsModule {}
