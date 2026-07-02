import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Guild } from './guild.entity';

@Entity('memberships')
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column('uuid')
  userId!: string;

  @ManyToOne(() => Guild, (guild) => guild.memberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'guildId' })
  guild!: Guild;

  @Column('uuid')
  guildId!: string;

  @CreateDateColumn()
  joinedAt!: Date;
}