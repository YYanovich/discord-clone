import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../common/redis/redis.service';

export interface IVoiceParticipant {
  userId: string;
  muted: boolean;
  deafened: boolean;
  joinedAt: string;
}

@Injectable()
export class VoiceService {
  private readonly logger = new Logger('VoiceService');

  private readonly CHANNEL_USERS = (channelId: string) =>
    `voice:channel:${channelId}:users`;
  private readonly GUILD_CHANNELS = (guildId: string) =>
    `voice:guild:${guildId}:channels`;
  private readonly USER_VOICE = (userId: string) => `voice:user:${userId}`;

  constructor(private readonly redisService: RedisService) {}

  async joinChannel(
    userId: string,
    channelId: string,
    guildId: string,
  ): Promise<void> {
    const participant: IVoiceParticipant = {
      userId,
      muted: false,
      deafened: false,
      joinedAt: new Date().toISOString(),
    };
    await this.redisService.sadd(this.CHANNEL_USERS(channelId), userId);

    await this.redisService.hset(
      `voice:channel:${channelId}:participants`,
      userId,
      JSON.stringify(participant),
    );

    await this.redisService.set(
      this.USER_VOICE(userId),
      JSON.stringify({ channelId, guildId }),
      3600,
    );

    await this.redisService.sadd(this.GUILD_CHANNELS(guildId), channelId);

    this.logger.log(`User ${userId} joined to voice channel ${channelId}`);
  }

  async leaveChannel(
    userId: string,
    channelId: string,
    guildId: string,
  ): Promise<IVoiceParticipant | null> {
    const participantData = await this.redisService.hget(
      `voice:channel:${channelId}:participants`,
      userId,
    );

    if (!participantData) return null;

    const participant: IVoiceParticipant = JSON.parse(participantData);

    await this.redisService.srem(this.CHANNEL_USERS(channelId), userId);
    await this.redisService.hdel(
      `voice:channel:${channelId}:participants`,
      userId,
    );
    await this.redisService.del(this.USER_VOICE(userId));

    const count = await this.redisService.scard(this.CHANNEL_USERS(channelId));
    if (count === 0) {
      await this.redisService.srem(this.GUILD_CHANNELS(guildId), channelId);
    }

    this.logger.log(`User ${userId} left from channel ${channelId}`);
    return participant;
  }

  async getChannelParticipants(
    channelId: string,
  ): Promise<IVoiceParticipant[]> {
    const data = await this.redisService.hgetall(
      `voice:channel:${channelId}:participants`,
    );
    return Object.values(data).map((v) => JSON.parse(v) as IVoiceParticipant);
  }

  async getUserVoiceChannel(userId: string): Promise<{
    channelId: string;
    guildId: string;
  } | null> {
    const data = await this.redisService.get(this.USER_VOICE(userId));
    if (!data) return null;
    return JSON.parse(data);
  }

  async getGuildVoiceState(
    guildId: string,
  ): Promise<Record<string, IVoiceParticipant[]>> {
    const channelIds = await this.redisService.smembers(
      this.GUILD_CHANNELS(guildId),
    );

    const result: Record<string, IVoiceParticipant[]> = {};

    for (const channelId of channelIds) {
      const participants = await this.getChannelParticipants(channelId);
      if (participants.length > 0) {
        result[channelId] = participants;
      }
    }

    return result;
  }

  async setMuted(
    userId: string,
    channelId: string,
    muted: boolean,
  ): Promise<IVoiceParticipant | null> {
    const data = await this.redisService.hget(
      `voice:channel:${channelId}:participants`,
      userId,
    );
    if (!data) return null;

    const participant: IVoiceParticipant = JSON.parse(data);
    participant.muted = muted;

    await this.redisService.hset(
      `voice:channel:${channelId}:participants`,
      userId,
      JSON.stringify(participant),
    );

    return participant;
  }

  async setDeafened(
    userId: string,
    channelId: string,
    deafened: boolean,
  ): Promise<IVoiceParticipant | null> {
    const data = await this.redisService.hget(
      `voice:channel:${channelId}:participants`,
      userId,
    );
    if (!data) return null;

    const participant: IVoiceParticipant = JSON.parse(data);
    participant.deafened = deafened;

    await this.redisService.hset(
      `voice:channel:${channelId}:participants`,
      userId,
      JSON.stringify(participant),
    );

    return participant;
  }

  async isInChannel(userId: string, channelId: string): Promise<boolean> {
    return this.redisService.hexists(
      `voice:channel:${channelId}:participants`,
      userId,
    );
  }
}
