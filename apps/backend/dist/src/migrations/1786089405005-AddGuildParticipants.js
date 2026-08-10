"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddGuildParticipants1786089405005 = void 0;
class AddGuildParticipants1786089405005 {
    constructor() {
        this.name = 'AddGuildParticipants1786089405005';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."channel_participants_status_enum" AS ENUM('WAITING_ADMIN_APPROVE', 'ADMIN_REJECTED', 'PARTICIPANT', 'WAITING_USER_ACCEPTANCE', 'USER_REJECTED_INVITE', 'BLOCKED')`);
        await queryRunner.query(`CREATE TABLE "channel_participants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "channelId" uuid NOT NULL, "userId" character varying NOT NULL, "inviterId" character varying, "permissions" bigint NOT NULL DEFAULT '3', "status" "public"."channel_participants_status_enum" NOT NULL DEFAULT 'PARTICIPANT', CONSTRAINT "PK_7a12a3d33e51542e48d485c6a94" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2e81765b3cc1b6d02e11790a78" ON "channel_participants"  ("channelId", "userId") `);
        await queryRunner.query(`CREATE TYPE "public"."guild_participants_status_enum" AS ENUM('WAITING_ADMIN_APPROVE', 'ADMIN_REJECTED', 'PARTICIPANT', 'WAITING_USER_ACCEPTANCE', 'USER_REJECTED_INVITE', 'BLOCKED')`);
        await queryRunner.query(`CREATE TABLE "guild_participants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "guildId" uuid NOT NULL, "userId" uuid NOT NULL, "inviterId" character varying, "permissions" bigint NOT NULL DEFAULT '3', "status" "public"."guild_participants_status_enum" NOT NULL DEFAULT 'PARTICIPANT', "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_05fbf86385783c7609d0c6cd068" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_cc367cb8eb38c0fb71a0c39f81" ON "guild_participants"  ("guildId", "userId") `);
        await queryRunner.query(`ALTER TABLE "channel_participants" ADD CONSTRAINT "FK_37753b01c107969540628ec9faa" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "guild_participants" ADD CONSTRAINT "FK_77acf28ca84b066da8aa4381833" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "guild_participants" ADD CONSTRAINT "FK_2e8855a45c0f1d07321bb88615d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "guild_participants" DROP CONSTRAINT "FK_2e8855a45c0f1d07321bb88615d"`);
        await queryRunner.query(`ALTER TABLE "guild_participants" DROP CONSTRAINT "FK_77acf28ca84b066da8aa4381833"`);
        await queryRunner.query(`ALTER TABLE "channel_participants" DROP CONSTRAINT "FK_37753b01c107969540628ec9faa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cc367cb8eb38c0fb71a0c39f81"`);
        await queryRunner.query(`DROP TABLE "guild_participants"`);
        await queryRunner.query(`DROP TYPE "public"."guild_participants_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2e81765b3cc1b6d02e11790a78"`);
        await queryRunner.query(`DROP TABLE "channel_participants"`);
        await queryRunner.query(`DROP TYPE "public"."channel_participants_status_enum"`);
    }
}
exports.AddGuildParticipants1786089405005 = AddGuildParticipants1786089405005;
//# sourceMappingURL=1786089405005-AddGuildParticipants.js.map