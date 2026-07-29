import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Channel } from './channel.entity';

@Entity('channel_overwrites')
export class ChannelOverwrite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Channel, { onDelete: 'CASCADE' })
  channel!: Channel;

  @Column()
  channelId!: string;

  @Column({ nullable: true })
  roleId!: string | null;

  @Column({ nullable: true })
  userId!: string | null;

  @Column({ type: 'bigint', default: 0 })
  allow!: number;

  @Column({ type: 'bigint', default: 0 })
  deny!: number;
}