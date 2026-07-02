import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column({ unique: true })
  email!: string;
  @Column()
  username!: string;
  @Column({ select: false })
  passwordHash!: string;
  @Column({ default: false })
  isEmailVerified!: boolean;
  @CreateDateColumn()
  createdAt!: Date;
  @UpdateDateColumn()
  updatedAt!: Date;
}
