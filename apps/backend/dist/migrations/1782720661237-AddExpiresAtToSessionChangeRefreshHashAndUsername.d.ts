import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddExpiresAtToSessionChangeRefreshHashAndUsername1782720661237 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
