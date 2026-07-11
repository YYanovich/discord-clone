import { MigrationInterface, QueryRunner } from "typeorm";
export declare class FixMessageTimestamptz1783676977823 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
