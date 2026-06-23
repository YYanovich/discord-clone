import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGeoFieldsToSession1782211215336 implements MigrationInterface {
    name = 'AddGeoFieldsToSession1782211215336'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sessions" ADD "country" character varying`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD "city" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "country"`);
    }

}
