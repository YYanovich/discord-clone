import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';
@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;
  @Column()
  refreshTokenHash!: string;
  @Column()
  userAgent!: string;
  @Column()
  ipAddress!: string;
  @Column({ type: 'varchar', nullable: true })
  country!: string | null;
  @Column({ type: 'varchar', nullable: true })
  city!: string | null;
  @Column({ default: true })
  isActive!: boolean;
  @CreateDateColumn()
  createdAt!: Date;
  @Column({ nullable: true })
  lastActiveAt!: Date;
}
