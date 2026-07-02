import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Session } from './entities/session.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async create(data: {
    email: string;
    username: string;
    passwordHash: string;
  }): Promise<User> {
    const existingUsername = await this.userRepo.findOne({
      where: { username: data.username },
    });
    if (existingUsername) {
      throw new Error('USERNAME_TAKEN');
    }
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  async createSession(data: {
    userId: string;
    sessionId: string;
    refreshTokenHash: string;
    fingerprint: string;
    userAgent: string;
    ipAddress: string;
    country?: string;
    city?: string;
  }): Promise<void> {
    const user = await this.findById(data.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = this.sessionRepo.create({
      id: data.sessionId,
      user: user,
      refreshTokenHash: data.refreshTokenHash,
      fingerprint: data.fingerprint,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
      country: data.country ?? null,
      city: data.city ?? null,
      expiresAt,
    });
    await this.sessionRepo.save(session);
  }

  async findActiveSession(sessionId: string): Promise<Session | null> {
    if (!sessionId) {
      return null;
    }
    return this.sessionRepo.findOne({
      where: { id: sessionId, isActive: true },
      relations: {
        user: true,
      },
    });
  }

  async updateSessionRefreshToken(
    sessionId: string,
    refreshTokenHash: string,
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.sessionRepo.update(
      { id: sessionId },
      {
        refreshTokenHash,
        expiresAt,
        lastActiveAt: new Date(),
      },
    );
  }

  async deactivateSession(sessionId: string): Promise<void> {
    await this.sessionRepo.update(
      { id: sessionId },
      { isActive: false, refreshTokenHash: null },
    );
  }
}
