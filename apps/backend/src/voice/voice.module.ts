import { Module } from '@nestjs/common';
import { VoiceService } from './voice.service';
import { LiveKitService } from './livekit.service';
import { VoiceAnalyticsService } from './voice-analytics.service';
import { VoiceAnalyticsConsumer } from './voice-analytics.consumer';
import { LiveKitWebhookController } from './livekit-webhook.controller';
import { RedisModule } from '../common/redis/redis.module';
import { KafkaModule } from '../kafka/kafka.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [RedisModule, KafkaModule, AnalyticsModule],
  providers: [
    VoiceService,
    LiveKitService,
    VoiceAnalyticsService,
    VoiceAnalyticsConsumer,
  ],
  controllers: [LiveKitWebhookController],
  exports: [VoiceService, LiveKitService, VoiceAnalyticsService],
})
export class VoiceModule {}
