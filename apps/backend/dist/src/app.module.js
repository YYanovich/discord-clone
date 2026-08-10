"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const throttler_storage_redis_1 = require("@nest-lab/throttler-storage-redis");
const ioredis_1 = __importDefault(require("ioredis"));
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const redis_module_1 = require("./common/redis/redis.module");
const guilds_module_1 = require("./guilds/guilds.module");
const events_module_1 = require("./events/events.module");
const messages_module_1 = require("./messages/messages.module");
const kafka_module_1 = require("./kafka/kafka.module");
const outbox_module_1 = require("./outbox/outbox.module");
const search_module_1 = require("./search/search.module");
const analytics_module_1 = require("./analytics/analytics.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DB_HOST ?? 'localhost',
                port: Number(process.env.DB_PORT ?? 5433),
                username: process.env.DB_USER ?? 'discord',
                password: process.env.DB_PASS ?? 'secret',
                database: process.env.DB_NAME ?? 'discord',
                autoLoadEntities: true,
                synchronize: false,
            }),
            throttler_1.ThrottlerModule.forRoot({
                throttlers: [
                    { name: 'short', ttl: 1000, limit: 10 },
                    { name: 'long', ttl: 60000, limit: 100 },
                ],
                storage: new throttler_storage_redis_1.ThrottlerStorageRedisService(new ioredis_1.default({
                    host: process.env.REDIS_HOST ?? 'localhost',
                    port: Number(process.env.REDIS_PORT ?? 6379),
                })),
            }),
            redis_module_1.RedisModule,
            kafka_module_1.KafkaModule,
            outbox_module_1.OutboxModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            guilds_module_1.GuildsModule,
            events_module_1.EventsModule,
            messages_module_1.MessagesModule,
            search_module_1.SearchModule,
            analytics_module_1.AnalyticsModule,
        ],
        providers: [{ provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard }],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map