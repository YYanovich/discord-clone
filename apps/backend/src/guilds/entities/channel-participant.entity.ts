import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { Channel } from './channel.entity';
import { ParticipantStatus } from './participant-status.enum';

export enum ChannelPermission {
  READ = 1 << 0, // 1
  WRITE = 1 << 1, // 2
  INVITE = 1 << 2, // 4
  DELETE = 1 << 3, // 8
  MANAGE = 1 << 4, // 16
}

@Entity('channel_participants')
@Index(['channelId', 'userId'], { unique: true })
export class ChannelParticipant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Channel, { onDelete: 'CASCADE' })
  channel!: Channel;

  @Column()
  channelId!: string;

  @Column()
  userId!: string;

  @Column({ nullable: true })
  inviterId!: string | null;

  @Column({
    type: 'bigint',
    default: ChannelPermission.READ | ChannelPermission.WRITE,
  })
  permissions!: number;

  @Column({
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.PARTICIPANT,
  })
  status!: ParticipantStatus;
}
