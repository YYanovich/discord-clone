import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Guild } from './guild.entity';
import { User } from '../../users/entities/user.entity';

@Entity('invites')
export class Invite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string;

  @ManyToOne(() => Guild, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guildId' })
  guild!: Guild;

  @Column('uuid')
  guildId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdById' })
  createdBy!: User;

  @Column('uuid')
  createdById!: string;

  @Column({ type: 'int', nullable: true, default: null })
  maxUses!: number | null;

  @Column({ type: 'int', default: 0 })
  uses!: number;

  @Column({ type: 'timestamp', nullable: true, default: null })
  expiresAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}