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
  @Column({ unique: true })
  username!: string;
  @Column()
  passwordHash!: string;
  @Column({ default: false })
  isEmailVerified!: boolean;
  @CreateDateColumn()
  createdAt!: Date;
  @UpdateDateColumn()
  updatedAt!: Date;
}
