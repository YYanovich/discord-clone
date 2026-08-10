import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddGuildParticipants1786089405005 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
