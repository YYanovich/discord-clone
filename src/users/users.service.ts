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
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async create(data: {
    email: string;
    username: string;
    passwordHash: string;
  }): Promise<User> {
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  async createSession(data: {
    userId: string;
    sessionId: string;
    refreshTokenHash: string;
    userAgent: string;
    ipAddress: string;
  }): Promise<void> {
    const user = await this.findById(data.userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${data.userId} not found`);
    }
    const session = this.sessionRepo.create({
      id: data.sessionId,
      user,
      refreshTokenHash: data.refreshTokenHash,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
    });
    await this.sessionRepo.save(session);
  }

  async deactivateSession(sessionId: string): Promise<void> {
    await this.sessionRepo.update({ id: sessionId }, { isActive: false });
  }
}
