import { MigrationInterface, QueryRunner } from 'typeorm';
/**
 * Create the database layout for Veramo 3.0
 *
 * @public
 */
export declare class CreateKVDatabaseMigration implements MigrationInterface {
    private readonly _tableName;
    readonly name: string;
    constructor(tableName?: string);
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
//# sourceMappingURL=1.createKVDatabase.d.ts.map