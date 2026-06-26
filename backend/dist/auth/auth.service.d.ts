import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RedisService } from '../common/redis/redis.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private usersService;
    private jwtService;
    private redisService;
    constructor(usersService: UsersService, jwtService: JwtService, redisService: RedisService);
    register(dto: RegisterDto): Promise<{
        id: string;
        email: string;
    }>;
    login(dto: LoginDto, userAgent: string, ip: string): Promise<{
        accessToken: string;
        refreshToken: string;
        sessionId: `${string}-${string}-${string}-${string}-${string}`;
        user: {
            id: string;
            email: string;
            username: string;
        };
    }>;
    issueTokens(user: User, userAgent: string, ip: string): Promise<{
        accessToken: string;
        refreshToken: string;
        sessionId: `${string}-${string}-${string}-${string}-${string}`;
        user: {
            id: string;
            email: string;
            username: string;
        };
    }>;
    refresh(refreshToken: string, sessionId: string): Promise<{
        accessToken: string;
        refreshToken: string;
        sessionId: `${string}-${string}-${string}-${string}-${string}`;
        user: {
            id: string;
            email: string;
            username: string;
        };
    }>;
    logout(sessionId: string): Promise<void>;
}
