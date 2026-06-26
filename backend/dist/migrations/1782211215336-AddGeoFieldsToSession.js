"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddGeoFieldsToSession1782211215336 = void 0;
class AddGeoFieldsToSession1782211215336 {
    name = 'AddGeoFieldsToSession1782211215336';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sessions" ADD "country" character varying`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD "city" character varying`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "country"`);
    }
}
exports.AddGeoFieldsToSession1782211215336 = AddGeoFieldsToSession1782211215336;
//# sourceMappingURL=1782211215336-AddGeoFieldsToSession.js.map