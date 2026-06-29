import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        config.get<string>('JWT_SECRET') ?? 'dev-secret-change-in-prod',
    });
  }
  async validate(payload: { sub: string; email: string; sessionId: string }) {
    if (!payload.sub) throw new UnauthorizedException();
    return {
      userId: payload.sub,
      email: payload.email,
      sessionid: payload.sessionId,
    };
  }
}
