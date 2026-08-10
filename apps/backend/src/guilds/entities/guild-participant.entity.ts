import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, CreateDateColumn, Index,
} from 'typeorm';
import { Guild } from './guild.entity';
import { User } from '../../users/entities/user.entity';

export enum ParticipantStatus {
  WAITING_ADMIN_APPROVE    = 'WAITING_ADMIN_APPROVE',
  ADMIN_REJECTED           = 'ADMIN_REJECTED',
  PARTICIPANT              = 'PARTICIPANT',
  WAITING_USER_ACCEPTANCE  = 'WAITING_USER_ACCEPTANCE',
  USER_REJECTED_INVITE     = 'USER_REJECTED_INVITE',
  BLOCKED                  = 'BLOCKED',
}

export enum GuildPermission {
  VIEW_CHANNELS    = 1 << 0,  // 1
  SEND_MESSAGES    = 1 << 1,  // 2
  CREATE_CHANNEL   = 1 << 2,  // 4
  INVITE_USER      = 1 << 3,  // 8
  DELETE_USER      = 1 << 4,  // 16
  EDIT_GUILD       = 1 << 5,  // 32
  ADMINISTRATOR    = 1 << 6,  // 64
}

@Entity('guild_participants')
@Index(['guildId', 'userId'], { unique: true })
export class GuildParticipant {
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
  inviterId!: string | null;

  //permissions integrated inside user table
  @Column({ type: 'bigint', default: GuildPermission.VIEW_CHANNELS | GuildPermission.SEND_MESSAGES })
  permissions!: number;

  @Column({
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.PARTICIPANT,
  })
  status!: ParticipantStatus;

  @CreateDateColumn()
  joinedAt!: Date;
}