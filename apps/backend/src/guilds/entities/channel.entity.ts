import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Guild } from './guild.entity';
import { Category } from './category.entity';

export enum ChannelType {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
}

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column()
  name!: string;
  @Column({
    type: 'enum',
    enum: ChannelType,
    default: ChannelType.TEXT,
  })
  type!: ChannelType;
  @ManyToOne(() => Guild, (guild) => guild.channels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guildId' })
  guild!: Guild;

  @Column('uuid')
  guildId!: string;
  @ManyToOne(() => Category, (category) => category.channels, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  category!: Category | null;
  @Column({ nullable: true })
  categoryId!: string | null;
  @Column({ default: 0 })
  position!: number;
}
