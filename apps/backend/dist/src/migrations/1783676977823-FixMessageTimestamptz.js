"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixMessageTimestamptz1783676977823 = void 0;
class FixMessageTimestamptz1783676977823 {
    constructor() {
        this.name = 'FixMessageTimestamptz1783676977823';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
    }
}
exports.FixMessageTimestamptz1783676977823 = FixMessageTimestamptz1783676977823;
//# sourceMappingURL=1783676977823-FixMessageTimestamptz.js.map