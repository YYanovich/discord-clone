import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Guild } from './guild.entity';
import { Channel } from './channel.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column()
  name!: string;
  @ManyToOne(() => Guild, (guild) => guild.categories, { onDelete: 'CASCADE' })
  guild!: Guild;
  @Column()
  guildId!: string;
  @Column({ default: 0 })
  position!: number;
  @OneToMany(() => Channel, (channel) => channel.category)
  channels!: Channel[]
}
