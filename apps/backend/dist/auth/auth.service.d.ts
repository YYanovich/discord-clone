import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export interface IRegisterResponse {
    success: boolean;
    message: string;
}
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(dto: RegisterDto): Promise<IRegisterResponse>;
    login(dto: LoginDto, fingerprint: string, ipAddress: string, userAgent: string): Promise<{
        accessToken: string;
        refreshToken: string;
        sessionId: `${string}-${string}-${string}-${string}-${string}`;
        user: {
            id: string;
            email: string;
            username: string;
        };
    }>;
    issueTokens(user: User, fingerprint: string, ipAddress: string, userAgent: string): Promise<{
        accessToken: string;
        refreshToken: string;
        sessionId: `${string}-${string}-${string}-${string}-${string}`;
        user: {
            id: string;
            email: string;
            username: string;
        };
    }>;
    refresh(refreshToken: string, sessionId: string, fingerprint: string): Promise<{
        accessToken: string;
        refreshToken: string;
        sessionId: string;
        user: {
            id: string;
            email: string;
            username: string;
        };
    }>;
    logout(sessionId: string): Promise<void>;
}
