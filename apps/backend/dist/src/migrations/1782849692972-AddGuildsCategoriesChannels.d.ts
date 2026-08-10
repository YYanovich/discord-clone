import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddGuildsCategoriesChannels1782849692972 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
