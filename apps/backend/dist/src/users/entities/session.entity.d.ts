import { User } from './user.entity';
export declare class Session {
    id: string;
    user: User;
    refreshTokenHash: string | null;
    fingerprint: string;
    userAgent: string;
    ipAddress: string;
    country: string | null;
    city: string | null;
    isActive: boolean;
    expiresAt: Date;
    createdAt: Date;
    lastActiveAt: Date;
}
