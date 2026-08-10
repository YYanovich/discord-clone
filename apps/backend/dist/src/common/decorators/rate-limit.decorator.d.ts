export interface RateLimitOptions {
    key: string;
    limit: number;
    ttl: number;
}
export declare const RATE_LIMIT_KEY = "rate_limit_options";
export declare const RateLimit: (options: RateLimitOptions) => import("@nestjs/common").CustomDecorator<string>;
