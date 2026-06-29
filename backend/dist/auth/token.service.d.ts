import { JwtService } from '@nestjs/jwt';
export declare class TokenService {
    private readonly jwtService;
    constructor(jwtService: JwtService);
    generateSessionId(): string;
    generateAccessToken(payload: {
        sub: string;
        email: string;
        sessionId: string;
        fingerprint: string;
    }): string;
    generateRefreshToken(): string;
    hashToken(token: string): Promise<string>;
}
