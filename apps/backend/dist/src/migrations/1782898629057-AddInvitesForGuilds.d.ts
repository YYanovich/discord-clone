import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddInvitesForGuilds1782898629057 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
