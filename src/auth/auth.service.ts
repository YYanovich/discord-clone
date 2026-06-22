import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RedisService } from '../common/redis/redis.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already taken');
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });
    const user = await this.usersService.create({
      email: dto.email,
      username: dto.username,
      passwordHash,
    });
    return { id: user.id, email: user.email };
  }

  async login(dto: LoginDto, userAgent: string, ip: string) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid credentionals');
    return this.issueTokens(user, userAgent, ip);
  }

  async issueTokens(user: User, userAgent: string, ip: string) {
    const sessionId = crypto.randomUUID();
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, sessionId },
      { expiresIn: '15m' },
    );
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshHash = await argon2.hash(refreshToken, {
      type: argon2.argon2id,
    });
    await this.redisService.set(
      `refresh:${sessionId}`,
      JSON.stringify({ userId: user.id, hash: refreshHash }),
      7 * 24 * 60 * 60,
    );
    await this.usersService.createSession({
      userId: user.id,
      sessionId,
      refreshTokenHash: refreshHash,
      userAgent,
      ipAddress: ip,
    });

    return { accessToken, refreshToken, sessionId };
  }

  async refresh(refreshToken: string, sessionId: string) {
    const key = `refresh:${sessionId}`;
    const stored = await this.redisService.get(key);
    if (!stored) throw new UnauthorizedException('Session expired');
    const { userId, hash } = JSON.parse(stored);
    const valid = await argon2.verify(hash, refreshToken);
    if (!valid) throw new UnauthorizedException('Invalid refresh token');
    await this.redisService.del(key);
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return this.issueTokens(user, '', '');
  }

  async logout(sessionId: string) {
    await this.redisService.del(`refresh:${sessionId}`);
    await this.usersService.deactivateSession(sessionId);
  }
}
