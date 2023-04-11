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
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyValueStore = void 0;
const keyv_1 = require("./keyv/keyv");
/**
 * Agent plugin that implements {@link @veramo/kv-store#IKeyValueStore} interface
 * @public
 */
class KeyValueStore {
    constructor(options) {
        this.keyv = new keyv_1.Keyv(options.uri, options);
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.keyv.get(key, { raw: false });
            if (result === null || result === undefined) {
                return undefined;
            }
            return result;
        });
    }
    getAsValueData(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.keyv.get(key, { raw: true });
            if (result === null || result === undefined) {
                // We always return a ValueData object for this method
                return { value: undefined, expires: undefined };
            }
            return this.toDeserializedValueData(result);
        });
    }
    getMany(keys) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!keys || keys.length === 0) {
                return [];
            }
            let result = yield this.keyv.getMany(keys, { raw: false });
            // Making sure we return the same array length as the amount of key(s) passed in
            if (result === null || result === undefined || result.length === 0) {
                result = new Array();
                keys.forEach(() => result.push(undefined));
            }
            return result.map((v) => (!!v ? v : undefined));
        });
    }
    getManyAsValueData(keys) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!keys || keys.length === 0) {
                return [];
            }
            let result = yield this.keyv.getMany(keys, { raw: true });
            // Making sure we return the same array length as the amount of key(s) passed in
            if (result === null || result === undefined || result.length === 0) {
                result = new Array();
                keys.forEach(() => result.push({ value: undefined, expires: undefined }));
            }
            return result.map((v) => !!v ? this.toDeserializedValueData(v) : { value: undefined, expires: undefined });
        });
    }
    set(key, value, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.keyv.set(key, value, ttl).then(() => this.getAsValueData(key));
        });
    }
    has(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.keyv.has(key);
        });
    }
    delete(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.keyv.delete(key);
        });
    }
    deleteMany(keys) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.all(keys.map((key) => this.keyv.delete(key)));
        });
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.keyv.clear().then(() => this);
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.keyv.disconnect();
        });
    }
    // Public so parties using the kv store directly can add listeners if they want
    kvStoreOn(args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.keyv.on(args.eventName, args.listener);
            return this;
        });
    }
    toDeserializedValueData(result) {
        if (result === null || result === undefined) {
            throw Error(`Result cannot be undefined or null at this this point`);
        }
        else if (typeof result !== 'object') {
            return { value: result, expires: undefined };
        }
        else if (!('value' in result)) {
            return { value: result, expires: undefined };
        }
        if (!('expires' in result)) {
            result.expires = undefined;
        }
        return result;
    }
}
exports.KeyValueStore = KeyValueStore;
//# sourceMappingURL=key-value-store.js.map