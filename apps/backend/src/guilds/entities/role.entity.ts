import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Guild } from './guild.entity';

//permission flags — bit mask
//1 bit = 1 rule
export enum PermissionFlag {
  VIEW_CHANNEL = 1 << 0, // = 1
  SEND_MESSAGES = 1 << 1, // = 2
  MANAGE_MESSAGES = 1 << 2, // = 4
  MANAGE_CHANNELS = 1 << 3, // = 8
  MANAGE_ROLES = 1 << 4, // = 16
  KICK_MEMBERS = 1 << 5, // = 32
  BAN_MEMBERS = 1 << 6, // = 64
  ADMINISTRATOR = 1 << 7, // = 128
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'integer', default: 0 })
  permissions!: number;

  @ManyToOne(() => Guild, { onDelete: 'CASCADE' })
  guild!: Guild;

  @Column()
  guildId!: string;

  @Column({ default: 0 })
  position!: number;
}
