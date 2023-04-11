"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateKVDatabaseMigration = void 0;
const typeorm_1 = require("typeorm");
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('veramo:kv-store:initial-migration');
/**
 * Create the database layout for Veramo 3.0
 *
 * @public
 */
class CreateKVDatabaseMigration {
    constructor(tableName) {
        this._tableName = tableName || 'keyvaluestore';
        this.name = `CreateKVDatabase${tableName}1680297189001`;
    }
    up(queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            function getTableName(givenName) {
                var _a;
                return (((_a = queryRunner.connection.entityMetadatas.find((meta) => meta.givenTableName === givenName)) === null || _a === void 0 ? void 0 : _a.tableName) ||
                    givenName);
            }
            debug(`creating ${this._tableName} table`);
            // CREATE TABLE "keyvaluestore" ("key" varchar PRIMARY KEY NOT NULL, "data" text NOT NULL)
            yield queryRunner.createTable(new typeorm_1.Table({
                name: getTableName(this._tableName),
                columns: [
                    { name: 'key', type: 'varchar', isPrimary: true },
                    { name: 'data', type: 'text', isNullable: false },
                ],
                indices: [
                    {
                        columnNames: ['key'],
                        isUnique: true,
                    },
                ],
            }), true);
        });
    }
    down(queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('illegal_operation: cannot roll back initial migration');
        });
    }
}
exports.CreateKVDatabaseMigration = CreateKVDatabaseMigration;
//# sourceMappingURL=1.createKVDatabase.js.map