import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, CreateDateColumn,
} from 'typeorm';
import { Guild } from './guild.entity';
import { User } from '../../users/entities/user.entity';

@Entity('bans')
export class Ban {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Guild, { onDelete: 'CASCADE' })
  guild!: Guild;

  @Column()
  guildId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @Column()
  userId!: string;

  @Column({ nullable: true })
  reason!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}