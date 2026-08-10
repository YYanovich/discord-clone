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
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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
      message: 'User has been registered successfully',
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
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return this.issueTokens(user, fingerprint, ipAddress, userAgent);
  }

  async issueTokens(
    user: User,
    fingerprint: string,
    ipAddress: string,
    userAgent: string,
  ) {
    const sessionId = crypto.randomUUID();
    
    // Consistent JWT payload structure
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, sessionId, fingerprint },
      { expiresIn: '15m' },
    );

    await this.usersService.createSession({
      sessionId,
      userId: user.id,
      fingerprint,
      ipAddress,
      userAgent,
    });

    return {
      //not return refresh token to user, save only in DB
      accessToken,
      sessionId,
      user: { id: user.id, email: user.email, username: user.username },
    };
  }

  async refresh(sessionId: string, fingerprint: string) {
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

    // Issue new access token using session metadata
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
      sessionId: session.id,
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