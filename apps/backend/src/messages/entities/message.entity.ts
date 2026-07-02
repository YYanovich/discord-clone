import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Channel } from '../../guilds/entities/channel.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  content!: string;

  @ManyToOne(() => Channel, { onDelete: 'CASCADE' })
  channel!: Channel;

  @Column()
  channelId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  author!: User;

  @Column()
  authorId!: string;

  @Column({ default: false })
  isDeleted!: boolean;

  @Column({ nullable: true })
  editedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}