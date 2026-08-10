import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { RedisService } from '../../common/redis/redis.service';
declare const JwtRefreshStrategy_base: new () => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtRefreshStrategy extends JwtRefreshStrategy_base {
    private redisService;
    constructor(redisService: RedisService);
    validate(req: Request): Promise<{
        userId: any;
        sessionId: any;
    }>;
}
export {};
