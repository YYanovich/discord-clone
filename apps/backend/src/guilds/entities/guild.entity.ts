import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from './category.entity';
import { Channel } from './channel.entity';
import { Invite } from './invite.entity';
@Entity('guilds')
export class Guild {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column()
  name!: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  owner!: User;
  @Column()
  ownerId!: string;
  @Column({ nullable: true })
  iconUrl!: string | null;
  @OneToMany(() => Category, (category) => category.guild, { cascade: true })
  categories!: Category[];
  @OneToMany(() => Channel, (channel) => channel.guild, { cascade: true })
  channels!: Channel[];

  @OneToMany(() => Invite, (invite) => invite.guild, { cascade: true })
  invites!: Invite[];
  @CreateDateColumn()
  createdAt!: Date;
}
