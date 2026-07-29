import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from './role.entity';
import { Guild } from './guild.entity';

@Entity('member_roles')
export class MemberRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @Column()
  userId!: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  role!: Role;

  @Column()
  roleId!: string;

  @ManyToOne(() => Guild, { onDelete: 'CASCADE' })
  guild!: Guild;

  @Column()
  guildId!: string;
}