import { MigrationInterface, QueryRunner } from "typeorm";
export declare class InitUserSession1781092972526 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
