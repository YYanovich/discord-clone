import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Guild } from './guild.entity';

@Entity('memberships')
export class Membership {
    @PrimaryGeneratedColumn('uuid')
    id!: string
    @ManyToOne(() => User, {onDelete: 'CASCADE'})
    user!: User
    @Column()
    userId!: string
    @ManyToOne(() => Guild, (guild) => guild.memberships, {
        onDelete: 'CASCADE'
    })
    guild!: Guild
    @Column()
    guildId!: string
    @CreateDateColumn()
    joinedAt!: Date
}