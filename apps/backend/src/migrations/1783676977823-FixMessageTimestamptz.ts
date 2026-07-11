import { MigrationInterface, QueryRunner } from "typeorm";

export class FixMessageTimestamptz1783676977823 implements MigrationInterface {
    name = 'FixMessageTimestamptz1783676977823'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
    }

}
