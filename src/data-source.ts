import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';
import { Session } from './users/entities/session.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'discord',
  password: process.env.DB_PASS ?? 'secret',
  database: process.env.DB_NAME ?? 'discord',
  entities: [User, Session],
  migrations: ['src/migrations/*.ts'],
  synchronize: false, 
});