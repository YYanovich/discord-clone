import { Module } from '@nestjs/common';
import { ClickHouseService } from './clickhouse.service';
import { AnalyticsConsumer } from './analytics.consumer';

@Module({
  providers: [ClickHouseService, AnalyticsConsumer],
  exports: [ClickHouseService],
})
export class AnalyticsModule {}