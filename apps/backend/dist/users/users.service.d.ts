import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Session } from './entities/session.entity';
export declare class UsersService {
    private userRepo;
    private sessionRepo;
    constructor(userRepo: Repository<User>, sessionRepo: Repository<Session>);
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    create(data: {
        email: string;
        username: string;
        passwordHash: string;
    }): Promise<User>;
    createSession(data: {
        userId: string;
        sessionId: string;
        refreshTokenHash: string;
        fingerprint: string;
        userAgent: string;
        ipAddress: string;
        country?: string;
        city?: string;
    }): Promise<void>;
    findActiveSession(sessionId: string): Promise<Session | null>;
    updateSessionRefreshToken(sessionId: string, refreshTokenHash: string): Promise<void>;
    deactivateSession(sessionId: string): Promise<void>;
}
