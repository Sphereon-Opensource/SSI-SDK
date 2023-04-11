"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kvStoreMigrations = void 0;
const _1_createKVDatabase_1 = require("./1.createKVDatabase");
/**
 * The migrations array that SHOULD be used when initializing a TypeORM database connection.
 *
 * These ensure the correct creation of tables and the proper migrations of data when tables change between versions.
 *
 * @public
 */
exports.kvStoreMigrations = [_1_createKVDatabase_1.CreateKVDatabaseMigration];
//# sourceMappingURL=index.js.map