"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddGuildIdToChannels1782856242769 = void 0;
class AddGuildIdToChannels1782856242769 {
    constructor() {
        this.name = 'AddGuildIdToChannels1782856242769';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "channels" DROP CONSTRAINT "FK_16f7ae247a7cf9894db7f23df8e"`);
        await queryRunner.query(`ALTER TABLE "channels" ALTER COLUMN "guildId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "channels" ADD CONSTRAINT "FK_16f7ae247a7cf9894db7f23df8e" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "channels" DROP CONSTRAINT "FK_16f7ae247a7cf9894db7f23df8e"`);
        await queryRunner.query(`ALTER TABLE "channels" ALTER COLUMN "guildId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "channels" ADD CONSTRAINT "FK_16f7ae247a7cf9894db7f23df8e" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
}
exports.AddGuildIdToChannels1782856242769 = AddGuildIdToChannels1782856242769;
//# sourceMappingURL=1782856242769-AddGuildIdToChannels.js.map