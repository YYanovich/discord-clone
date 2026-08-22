import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventsGateway } from './events.gateway';
import { GuildsModule } from '../guilds/guilds.module';
import { MessagesModule } from '../messages/messages.module';
import { VoiceModule } from '../voice/voice.module'; 

@Module({
  imports: [
    GuildsModule,
    forwardRef(() => MessagesModule),
    VoiceModule, 
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ??
          'dev-secret-change-in-prod',
      }),
    }),
  ],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
