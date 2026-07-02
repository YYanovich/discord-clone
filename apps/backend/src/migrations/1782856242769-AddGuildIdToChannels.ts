import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGuildIdToChannels1782856242769 implements MigrationInterface {
    name = 'AddGuildIdToChannels1782856242769'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channels" DROP CONSTRAINT "FK_16f7ae247a7cf9894db7f23df8e"`);
        await queryRunner.query(`ALTER TABLE "channels" ALTER COLUMN "guildId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "channels" ADD CONSTRAINT "FK_16f7ae247a7cf9894db7f23df8e" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channels" DROP CONSTRAINT "FK_16f7ae247a7cf9894db7f23df8e"`);
        await queryRunner.query(`ALTER TABLE "channels" ALTER COLUMN "guildId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "channels" ADD CONSTRAINT "FK_16f7ae247a7cf9894db7f23df8e" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
