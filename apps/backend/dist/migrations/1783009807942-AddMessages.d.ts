import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddMessages1783009807942 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
