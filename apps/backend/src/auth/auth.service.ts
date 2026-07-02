import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RedisService } from '../common/redis/redis.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export interface IRegisterResponse {
  success: boolean;
  message: string;
}
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<IRegisterResponse> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already taken');
    }

    let passwordHash: string;
    try {
      passwordHash = await argon2.hash(dto.password, {
        type: argon2.argon2id,
      });
    } catch (argonError) {
      console.error('Argon2 hashing failed:', argonError);
      throw new InternalServerErrorException(
        'Registration failed due to a security error',
      );
    }

    try {
      await this.usersService.create({
        email: dto.email,
        username: dto.username,
        passwordHash,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'USERNAME_TAKEN') {
        throw new ConflictException('Username already taken');
      }
      throw new InternalServerErrorException(
        'Database error during registration',
      );
    }

    return {
      success: true,
      message: 'User has been registered successfully.',
    };
  }

  async login(
    dto: LoginDto,
    fingerprint: string,
    ipAddress: string,
    userAgent: string,
  ) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid credentionals');
    return this.issueTokens(user, fingerprint, ipAddress, userAgent);
  }

  async issueTokens(
    user: User,
    fingerprint: string,
    ipAddress: string,
    userAgent: string,
  ) {
    const sessionId = crypto.randomUUID();
    const accessToken = this.jwtService.sign(
      { sub: user.id, sessionId, fingerprint },
      { expiresIn: '15m' },
    );
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshHash = await argon2.hash(refreshToken, {
      type: argon2.argon2id,
    });

    await this.usersService.createSession({
      sessionId,
      userId: user.id,
      refreshTokenHash: refreshHash,
      fingerprint,
      ipAddress,
      userAgent,
    });

    return {
      accessToken,
      refreshToken,
      sessionId,
      user: { id: user.id, email: user.email, username: user.username },
    };
  }

  async refresh(refreshToken: string, sessionId: string, fingerprint: string) {
    const session = await this.usersService.findActiveSession(sessionId);

    if (!session) {
      throw new UnauthorizedException('Session expired');
    }

    if (new Date() > session.expiresAt) {
      await this.usersService.deactivateSession(sessionId);
      throw new UnauthorizedException('Session expired');
    }
    if (session.fingerprint !== fingerprint) {
      await this.usersService.deactivateSession(sessionId);
      throw new UnauthorizedException('Invalid device');
    }
    const valid = await argon2.verify(session.refreshTokenHash!, refreshToken);
    if (!valid) throw new UnauthorizedException('Invalid refresh token');

    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const newRefreshHash = await argon2.hash(newRefreshToken, {
      type: argon2.argon2id,
    });

    await this.usersService.updateSessionRefreshToken(
      sessionId,
      newRefreshHash,
    );

    const accessToken = this.jwtService.sign(
      {
        sub: session.user.id,
        email: session.user.email,
        sessionId,
        fingerprint,
      },
      { expiresIn: '15m' },
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
      sessionId,
      user: {
        id: session.user.id,
        email: session.user.email,
        username: session.user.username,
      },
    };
  }

  async logout(sessionId: string) {
    await this.usersService.deactivateSession(sessionId);
  }
}
