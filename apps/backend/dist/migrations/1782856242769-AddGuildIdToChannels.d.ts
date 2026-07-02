import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddGuildIdToChannels1782856242769 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
