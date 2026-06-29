"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddExpiresAtToSessionChangeRefreshHashAndUsername1782720661237 = void 0;
class AddExpiresAtToSessionChangeRefreshHashAndUsername1782720661237 {
    constructor() {
        this.name = 'AddExpiresAtToSessionChangeRefreshHashAndUsername1782720661237';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sessions" ADD "fingerprint" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD "expiresAt" TIMESTAMP NOT NULL DEFAULT NOW()`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "refreshTokenHash"`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD "refreshTokenHash" text`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "refreshTokenHash"`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD "refreshTokenHash" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username")`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "expiresAt"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "fingerprint"`);
    }
}
exports.AddExpiresAtToSessionChangeRefreshHashAndUsername1782720661237 = AddExpiresAtToSessionChangeRefreshHashAndUsername1782720661237;
//# sourceMappingURL=1782720661237-AddExpiresAtToSessionChangeRefreshHashAndUsername.js.map