import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  ManyToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from './category.entity';
import { Channel } from './channel.entity';
import { Membership } from './membership.entity';

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
  categories!:Category[]
  @OneToMany(() => Channel, (channel) => channel.guild, { cascade: true })
  channels!: Channel[];

  @OneToMany(() => Membership, (membership) => membership.guild, {
    cascade: true,
  })
  memberships!: Membership[];
  @CreateDateColumn()
  createdAt!: Date
}
