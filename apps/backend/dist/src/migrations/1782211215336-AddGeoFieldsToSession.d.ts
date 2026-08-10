import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddGeoFieldsToSession1782211215336 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
