import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMessages1783009807942 implements MigrationInterface {
    name = 'AddMessages1783009807942'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "channelId" uuid NOT NULL, "authorId" uuid NOT NULL, "isDeleted" boolean NOT NULL DEFAULT false, "editedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_fad0fd6def6fa89f66dcf5aaca5" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_819e6bb0ee78baf73c398dc707f" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_819e6bb0ee78baf73c398dc707f"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_fad0fd6def6fa89f66dcf5aaca5"`);
        await queryRunner.query(`DROP TABLE "messages"`);
    }

}
