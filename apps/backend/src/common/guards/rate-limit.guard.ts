import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { RedisService } from '../redis/redis.service';
import { RATE_LIMIT_KEY } from '../decorators/rate-limit.decorator';
import type { RateLimitOptions } from '../decorators/rate-limit.decorator';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    //get oprtions from @RateLimit decorator
    const options = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!options) return true; 

    const req = context.switchToHttp().getRequest<Request>();
    const ip = (req.headers['x-forwarded-for'] as string)
      || req.socket.remoteAddress
      || 'unknown';

    const redisKey = `rate_limit:${options.key}:${ip}`;

    const current = await this.redisService.incr(redisKey);

    if (current === 1) {
      await this.redisService.expire(redisKey, options.ttl);
    }

    if (current > options.limit) {
      throw new HttpException(
        {
          message: `Too many requests. Try again in ${options.ttl} seconds.`,
          retryAfter: options.ttl,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}