import { OnModuleDestroy } from '@nestjs/common';
export declare class RedisService implements OnModuleDestroy {
    private client;
    constructor();
    set(key: string, value: string, ttlSeconds: number): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
