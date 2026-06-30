"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const redis_module_1 = require("./common/redis/redis.module");
const user_entity_1 = require("./users/entities/user.entity");
const session_entity_1 = require("./users/entities/session.entity");
const guild_entity_1 = require("./guilds/entities/guild.entity");
const category_entity_1 = require("./guilds/entities/category.entity");
const channel_entity_1 = require("./guilds/entities/channel.entity");
const membership_entity_1 = require("./guilds/entities/membership.entity");
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
                entities: [user_entity_1.User, session_entity_1.Session, guild_entity_1.Guild, category_entity_1.Category, channel_entity_1.Channel, membership_entity_1.Membership],
                synchronize: false,
                migrations: ['dist/migrations/*.js'],
                migrationsRun: true,
            }),
            redis_module_1.RedisModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map