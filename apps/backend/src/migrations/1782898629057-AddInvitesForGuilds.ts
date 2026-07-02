import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInvitesForGuilds1782898629057 implements MigrationInterface {
    name = 'AddInvitesForGuilds1782898629057'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "invites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "guildId" uuid NOT NULL, "createdById" uuid NOT NULL, "maxUses" integer, "uses" integer NOT NULL DEFAULT '0', "expiresAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_33fd8a248db1cd832baa8aa25bf" UNIQUE ("code"), CONSTRAINT "PK_aa52e96b44a714372f4dd31a0af" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "invites" ADD CONSTRAINT "FK_2f6fda7d4a43b8f07fb02321b82" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invites" ADD CONSTRAINT "FK_5443fd9ee41280475095b6157eb" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invites" DROP CONSTRAINT "FK_5443fd9ee41280475095b6157eb"`);
        await queryRunner.query(`ALTER TABLE "invites" DROP CONSTRAINT "FK_2f6fda7d4a43b8f07fb02321b82"`);
        await queryRunner.query(`DROP TABLE "invites"`);
    }

}
