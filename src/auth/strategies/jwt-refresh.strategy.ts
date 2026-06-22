import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import * as argon2 from 'argon2';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private redisService: RedisService) {
    super();
  }

  async validate(req: Request) {
    const refreshToken = req.cookies?.refresh_token;
    const sessionId = req.cookies?.session_id;

    if (!refreshToken || !sessionId) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const stored = await this.redisService.get(`refresh:${sessionId}`);
    if (!stored) throw new UnauthorizedException('Session expired');

    const { userId, hash } = JSON.parse(stored);
    const valid = await argon2.verify(hash, refreshToken);
    if (!valid) throw new UnauthorizedException('Invalid refresh token');

    return { userId, sessionId };
  }
}
