"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Backend3PermBan1784972858789 = void 0;
class Backend3PermBan1784972858789 {
    constructor() {
        this.name = 'Backend3PermBan1784972858789';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "bans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "guildId" uuid NOT NULL, "userId" uuid NOT NULL, "reason" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a4d6f261bffa4615c62d756566a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "channel_overwrites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "channelId" uuid NOT NULL, "roleId" character varying, "userId" character varying, "allow" bigint NOT NULL DEFAULT '0', "deny" bigint NOT NULL DEFAULT '0', CONSTRAINT "PK_b9e61ed10d25962ebe353fd8d73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "permissions" bigint NOT NULL DEFAULT '0', "guildId" uuid NOT NULL, "position" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "member_roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "roleId" uuid NOT NULL, "guildId" uuid NOT NULL, CONSTRAINT "PK_b501a9d44030060f7bf87852d15" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."outbox_status_enum" AS ENUM('PENDING', 'PUBLISHED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "outbox" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "topic" character varying NOT NULL, "payload" jsonb NOT NULL, "status" "public"."outbox_status_enum" NOT NULL DEFAULT 'PENDING', "errorMessage" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "publishedAt" TIMESTAMP, CONSTRAINT "PK_340ab539f309f03bdaa14aa7649" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "bans" ADD CONSTRAINT "FK_5c4f771067750f3c1aa58b8874c" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bans" ADD CONSTRAINT "FK_9632281c7b064fabedd8b7ae885" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_overwrites" ADD CONSTRAINT "FK_0510e6dd363b3a647b797e7e382" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "roles" ADD CONSTRAINT "FK_06fc9556b77dfbf53f03b6d3379" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "member_roles" ADD CONSTRAINT "FK_6d69d1800c5d57787a53c26d405" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "member_roles" ADD CONSTRAINT "FK_644bb76e4fff74a74d6797a25b3" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "member_roles" ADD CONSTRAINT "FK_2b7dfb92a750df66a381352ec40" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "member_roles" DROP CONSTRAINT "FK_2b7dfb92a750df66a381352ec40"`);
        await queryRunner.query(`ALTER TABLE "member_roles" DROP CONSTRAINT "FK_644bb76e4fff74a74d6797a25b3"`);
        await queryRunner.query(`ALTER TABLE "member_roles" DROP CONSTRAINT "FK_6d69d1800c5d57787a53c26d405"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "FK_06fc9556b77dfbf53f03b6d3379"`);
        await queryRunner.query(`ALTER TABLE "channel_overwrites" DROP CONSTRAINT "FK_0510e6dd363b3a647b797e7e382"`);
        await queryRunner.query(`ALTER TABLE "bans" DROP CONSTRAINT "FK_9632281c7b064fabedd8b7ae885"`);
        await queryRunner.query(`ALTER TABLE "bans" DROP CONSTRAINT "FK_5c4f771067750f3c1aa58b8874c"`);
        await queryRunner.query(`DROP TABLE "outbox"`);
        await queryRunner.query(`DROP TYPE "public"."outbox_status_enum"`);
        await queryRunner.query(`DROP TABLE "member_roles"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "channel_overwrites"`);
        await queryRunner.query(`DROP TABLE "bans"`);
    }
}
exports.Backend3PermBan1784972858789 = Backend3PermBan1784972858789;
//# sourceMappingURL=1784972858789-backend3Perm-ban.js.map