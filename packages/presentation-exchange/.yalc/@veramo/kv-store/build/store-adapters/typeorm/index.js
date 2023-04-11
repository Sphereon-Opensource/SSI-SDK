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
exports.getConnectedDb = exports.KeyValueTypeORMStoreAdapter = exports.kvStoreMigrations = exports.KeyValueStoreEntity = void 0;
const events_1 = require("events");
const typeorm_1 = require("typeorm");
const keyValueStoreEntity_1 = require("./entities/keyValueStoreEntity");
const json_buffer_1 = __importDefault(require("json-buffer"));
var keyValueStoreEntity_2 = require("./entities/keyValueStoreEntity");
Object.defineProperty(exports, "KeyValueStoreEntity", { enumerable: true, get: function () { return keyValueStoreEntity_2.KeyValueStoreEntity; } });
var migrations_1 = require("./migrations");
Object.defineProperty(exports, "kvStoreMigrations", { enumerable: true, get: function () { return migrations_1.kvStoreMigrations; } });
class KeyValueTypeORMStoreAdapter extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.dbConnection = options.dbConnection;
        this.namespace = options.namespace || 'keyv';
        this.opts = Object.assign({ validator: () => true, dialect: 'typeorm', serialize: json_buffer_1.default.stringify, deserialize: json_buffer_1.default.parse }, options);
    }
    get(key, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(key)) {
                return this.getMany(key, options);
            }
            const connection = yield getConnectedDb(this.dbConnection);
            const result = yield connection.getRepository(keyValueStoreEntity_1.KeyValueStoreEntity).findOneBy({
                key,
            });
            return (options === null || options === void 0 ? void 0 : options.raw) !== true || !result ? result === null || result === void 0 ? void 0 : result.data : { value: result === null || result === void 0 ? void 0 : result.data, expires: result === null || result === void 0 ? void 0 : result.expires };
        });
    }
    getMany(keys, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield getConnectedDb(this.dbConnection);
            const results = yield connection.getRepository(keyValueStoreEntity_1.KeyValueStoreEntity).findBy({
                key: (0, typeorm_1.In)(keys),
            });
            const values = keys.map((key) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                const result = results.find((result) => result.key === key);
                return (options === null || options === void 0 ? void 0 : options.raw) !== true || !result
                    ? result === null || result === void 0 ? void 0 : result.data
                    : {
                        value: (result === null || result === void 0 ? void 0 : result.data) ? (_a = (yield this.opts.deserialize(result.data))) === null || _a === void 0 ? void 0 : _a.value : undefined,
                        expires: result === null || result === void 0 ? void 0 : result.expires,
                    };
            }));
            return Promise.all(values);
        });
    }
    set(key, value, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield getConnectedDb(this.dbConnection);
            const entity = new keyValueStoreEntity_1.KeyValueStoreEntity();
            entity.key = key;
            entity.data = value;
            entity.expires = ttl;
            yield connection.getRepository(keyValueStoreEntity_1.KeyValueStoreEntity).save(entity);
            return { value: value, expires: ttl };
        });
    }
    delete(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(key)) {
                return this.deleteMany(key);
            }
            const connection = yield getConnectedDb(this.dbConnection);
            const result = yield connection.getRepository(keyValueStoreEntity_1.KeyValueStoreEntity).delete({ key });
            return result.affected === 1;
        });
    }
    deleteMany(keys) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield getConnectedDb(this.dbConnection);
            const results = yield connection.getRepository(keyValueStoreEntity_1.KeyValueStoreEntity).delete({
                key: (0, typeorm_1.In)(keys),
            });
            return !!results.affected && results.affected >= 1;
        });
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield getConnectedDb(this.dbConnection);
            yield connection.getRepository(keyValueStoreEntity_1.KeyValueStoreEntity).delete({
                key: (0, typeorm_1.Like)(`${this.namespace}:%`),
            });
        });
    }
    has(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield getConnectedDb(this.dbConnection);
            const result = yield connection.getRepository(keyValueStoreEntity_1.KeyValueStoreEntity).countBy({
                key,
            });
            return result === 1;
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield getConnectedDb(this.dbConnection);
            connection.destroy();
        });
    }
}
exports.KeyValueTypeORMStoreAdapter = KeyValueTypeORMStoreAdapter;
/**
 *  Ensures that the provided DataSource is connected.
 *
 * @param dbConnection - a TypeORM DataSource or a Promise that resolves to a DataSource
 */
function getConnectedDb(dbConnection) {
    return __awaiter(this, void 0, void 0, function* () {
        if (dbConnection instanceof Promise) {
            return yield dbConnection;
        }
        else if (!dbConnection.isInitialized) {
            return yield dbConnection.initialize();
        }
        else {
            return dbConnection;
        }
    });
}
exports.getConnectedDb = getConnectedDb;
//# sourceMappingURL=index.js.map