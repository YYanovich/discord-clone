"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddGuildsCategoriesChannels1782849692972 = void 0;
class AddGuildsCategoriesChannels1782849692972 {
    constructor() {
        this.name = 'AddGuildsCategoriesChannels1782849692972';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."channels_type_enum" AS ENUM('TEXT', 'VOICE')`);
        await queryRunner.query(`CREATE TABLE "channels" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "type" "public"."channels_type_enum" NOT NULL DEFAULT 'TEXT', "categoryId" uuid, "position" integer NOT NULL DEFAULT '0', "guildId" uuid, CONSTRAINT "PK_bc603823f3f741359c2339389f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "guildId" uuid NOT NULL, "position" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "guildId" uuid NOT NULL, "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_25d28bd932097a9e90495ede7b4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "guilds" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "ownerId" uuid NOT NULL, "iconUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e7e7f2a51bd6d96a9ac2aa560f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "sessions" ALTER COLUMN "fingerprint" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "sessions" ALTER COLUMN "expiresAt" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "channels" ADD CONSTRAINT "FK_16f7ae247a7cf9894db7f23df8e" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channels" ADD CONSTRAINT "FK_bdcf35fbf8fbd8e240caef4ca93" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_5a34f587ed2aae4cef8a432248a" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "memberships" ADD CONSTRAINT "FK_187d573e43b2c2aa3960df20b78" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "memberships" ADD CONSTRAINT "FK_3a41d99b7091e54569f86a758d7" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "guilds" ADD CONSTRAINT "FK_1ea4af7ab47f7b7e48427ce1f1d" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "guilds" DROP CONSTRAINT "FK_1ea4af7ab47f7b7e48427ce1f1d"`);
        await queryRunner.query(`ALTER TABLE "memberships" DROP CONSTRAINT "FK_3a41d99b7091e54569f86a758d7"`);
        await queryRunner.query(`ALTER TABLE "memberships" DROP CONSTRAINT "FK_187d573e43b2c2aa3960df20b78"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_5a34f587ed2aae4cef8a432248a"`);
        await queryRunner.query(`ALTER TABLE "channels" DROP CONSTRAINT "FK_bdcf35fbf8fbd8e240caef4ca93"`);
        await queryRunner.query(`ALTER TABLE "channels" DROP CONSTRAINT "FK_16f7ae247a7cf9894db7f23df8e"`);
        await queryRunner.query(`ALTER TABLE "sessions" ALTER COLUMN "expiresAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "sessions" ALTER COLUMN "fingerprint" SET DEFAULT ''`);
        await queryRunner.query(`DROP TABLE "guilds"`);
        await queryRunner.query(`DROP TABLE "memberships"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "channels"`);
        await queryRunner.query(`DROP TYPE "public"."channels_type_enum"`);
    }
}
exports.AddGuildsCategoriesChannels1782849692972 = AddGuildsCategoriesChannels1782849692972;
//# sourceMappingURL=1782849692972-AddGuildsCategoriesChannels.js.map