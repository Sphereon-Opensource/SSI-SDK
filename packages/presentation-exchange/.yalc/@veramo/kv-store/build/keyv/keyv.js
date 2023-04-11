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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Keyv = void 0;
const events_1 = require("events");
const json_buffer_1 = __importDefault(require("json-buffer"));
/**
 * Please note that this is code adapted from @link https://github.com/jaredwray/keyv to support Typescript and ESM in Veramo
 *
 * The code should support the storage plugins available for the keyv project.
 * Veramo itself supports NodeJS, Browser and React-Native environment.
 * Please be aware that these requirements probably aren't true for any keyv storage plugins.
 *
 * One of the big changes compared to the upstream project is that this port does not have dynamic loading of store-adapters based on URIs.
 * We believe that any Veramo Key Value store should use explicitly defined store-adapters.
 *
 * The port is part of the Veramo Key Value Store module, as we do not want to make an official maintained port out of it.
 * Veramo exposes its own API/interfaces for the Key Value store, meaning we could also support any other implementation in the future
 *
 * The Veramo kv-store module provides out of the box support for in memory/maps, sqlite and typeorm implementations,
 * including a tiered local/remote implementation that support all environments.
 *
 * We welcome any new storage modules
 */
class Keyv extends events_1.EventEmitter {
    constructor(uri, options) {
        super();
        const emitErrors = (options === null || options === void 0 ? void 0 : options.emitErrors) === undefined ? true : options.emitErrors;
        uri = uri !== null && uri !== void 0 ? uri : options === null || options === void 0 ? void 0 : options.uri;
        /*if (!uri) {
          throw Error('No URI provided')
        }*/
        this.opts = Object.assign(Object.assign({ namespace: 'keyv', serialize: json_buffer_1.default.stringify, deserialize: json_buffer_1.default.parse }, (typeof uri === 'string' ? { uri } : uri)), options);
        if (!this.opts.store) {
            if (typeof uri !== 'string') {
                this.opts.store = uri;
            } /* else {
              const adapterOptions = { ...this.opts }
              this.opts.store = loadStore(adapterOptions)
            }*/
        }
        if (!this.opts.store) {
            throw Error('No store');
        }
        if (this.opts.compression) {
            const compression = this.opts.compression;
            this.opts.serialize = compression.serialize.bind(compression);
            this.opts.deserialize = compression.deserialize.bind(compression);
        }
        if (typeof this.opts.store.on === 'function' && emitErrors) {
            this.opts.store.on('error', (error) => this.emit('error', error));
        }
        this.opts.store.namespace = this.opts.namespace || 'keyv';
        this.namespace = this.opts.store.namespace;
        const generateIterator = (iterator, keyv) => function () {
            return __asyncGenerator(this, arguments, function* () {
                var _a, e_1, _b, _c;
                try {
                    for (var _d = true, _e = __asyncValues(typeof iterator === 'function'
                        ? iterator(keyv.store.namespace)
                        : iterator), _f; _f = yield __await(_e.next()), _a = _f.done, !_a;) {
                        _c = _f.value;
                        _d = false;
                        try {
                            const [key, raw] = _c;
                            const data = yield __await(keyv.deserialize(raw));
                            if (keyv.store.namespace && !key.includes(keyv.store.namespace)) {
                                continue;
                            }
                            if (data && typeof data.expires === 'number' && Date.now() > data.expires) {
                                keyv.delete(key);
                                continue;
                            }
                            yield yield __await([keyv._getKeyUnprefix(key), data === null || data === void 0 ? void 0 : data.value]);
                        }
                        finally {
                            _d = true;
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = _e.return)) yield __await(_b.call(_e));
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            });
        };
        // Attach iterators
        // @ts-ignore
        if (typeof this.store[Symbol.iterator] === 'function' && this.store instanceof Map) {
            this.iterator = generateIterator(this.store, this);
        }
        else if (typeof this.store.iterator === 'function' && this.store.opts && this._checkIterableAdapter()) {
            this.iterator = generateIterator(this.store.iterator.bind(this.store), this);
        }
    }
    get store() {
        return this.opts.store;
    }
    get deserialize() {
        return this.opts.deserialize;
    }
    get serialize() {
        return this.opts.serialize;
    }
    _checkIterableAdapter() {
        return ((this.store.opts.dialect && iterableAdapters.includes(this.store.opts.dialect)) ||
            (this.store.opts.url &&
                iterableAdapters.findIndex((element) => this.store.opts.url.includes(element)) >= 0));
    }
    _getKeyPrefix(key) {
        return `${this.opts.namespace}:${key}`;
    }
    _getKeyPrefixArray(keys) {
        return keys.map((key) => this._getKeyPrefix(key));
    }
    _getKeyUnprefix(key) {
        return key.split(':').splice(1).join(':');
    }
    getMany(keys, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const keyPrefixed = this._getKeyPrefixArray(keys);
            let promise;
            if (this.store.getMany !== undefined) {
                promise = this.store.getMany(keyPrefixed, options); //.then(value => !!value ? value.values() : undefined)
                // todo: Probably wise to check expired ValueData here, if the getMany does not implement this feature itself!
            }
            else {
                promise = Promise.all(keyPrefixed.map((k) => this.store.get(k, options)));
            }
            const allValues = Promise.resolve(promise);
            const results = [];
            return Promise.resolve(allValues)
                .then((all) => {
                keys.forEach((key, index) => {
                    const data = all[index];
                    let result = typeof data === 'string'
                        ? this.deserialize(data)
                        : !!data && this.opts.compression
                            ? this.deserialize(data)
                            : data;
                    if (result &&
                        typeof result === 'object' &&
                        'expires' in result &&
                        typeof result.expires === 'number' &&
                        Date.now() > result.expires) {
                        this.delete(key);
                        result = undefined;
                    }
                    const final = (options && options.raw
                        ? result
                        : result && typeof result === 'object' && 'value' in result
                            ? result.value
                            : result);
                    results.push(final);
                });
            })
                .then(() => Promise.all(results));
        });
    }
    get(key, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const isArray = Array.isArray(key);
            return Promise.resolve()
                .then(() => isArray
                ? this.getMany(this._getKeyPrefixArray(key), options)
                : this.store.get(this._getKeyPrefix(key)))
                .then((data) => typeof data === 'string'
                ? this.deserialize(data)
                : this.opts.compression
                    ? this.deserialize(data)
                    : data)
                .then((data) => {
                if (data === undefined || data === null) {
                    return undefined;
                }
                const rows = Array.isArray(data) ? data : [data];
                if (isArray) {
                    const result = [];
                    for (let row of rows) {
                        if (row === undefined || row === null) {
                            result.push(undefined);
                            continue;
                        }
                        if (this.isExpired(row)) {
                            this.delete(key).then(() => undefined);
                            result.push(undefined);
                        }
                        else {
                            result.push(options && options.raw ? row : toValue(row));
                        }
                    }
                    return result;
                }
                else if (!Array.isArray(data)) {
                    if (this.isExpired(data)) {
                        return this.delete(key).then(() => undefined);
                    }
                }
                return options && options.raw
                    ? data
                    : Array.isArray(data)
                        ? data.map((d) => toValue(d))
                        : toValue(data);
            });
        });
    }
    isExpired(data) {
        return (typeof data !== 'string' &&
            data &&
            typeof data === 'object' &&
            'expires' in data &&
            typeof data.expires === 'number' &&
            Date.now() > data.expires);
    }
    set(key, value, ttl) {
        const keyPrefixed = this._getKeyPrefix(key);
        if (typeof ttl === 'undefined') {
            ttl = this.opts.ttl;
        }
        if (ttl === 0) {
            ttl = undefined;
        }
        // @ts-ignore
        return Promise.resolve()
            .then(() => {
            const expires = typeof ttl === 'number' ? Date.now() + ttl : undefined;
            if (typeof value === 'symbol') {
                this.emit('error', 'symbol cannot be serialized');
            }
            const input = { value, expires };
            return this.serialize(input);
        })
            .then((value) => this.store.set(keyPrefixed, value, ttl))
            .then(() => true);
    }
    delete(key) {
        if (!Array.isArray(key)) {
            const keyPrefixed = this._getKeyPrefix(key);
            return Promise.resolve().then(() => this.store.delete(keyPrefixed));
        }
        const keyPrefixed = this._getKeyPrefixArray(key);
        if (this.store.deleteMany !== undefined) {
            return Promise.resolve().then(() => this.store.deleteMany(keyPrefixed));
        }
        const promises = [];
        for (const key of keyPrefixed) {
            promises.push(this.store.delete(key));
        }
        return Promise.allSettled(promises).then((values) => values.every((x) => x.valueOf() === true));
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve().then(() => this.store.clear());
        });
    }
    has(key) {
        const keyPrefixed = this._getKeyPrefix(key);
        return Promise.resolve().then(() => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.store.has === 'function') {
                return this.store.has(keyPrefixed);
            }
            const value = yield this.store.get(keyPrefixed);
            return value !== undefined;
        }));
    }
    disconnect() {
        if (typeof this.store.disconnect === 'function') {
            return this.store.disconnect();
        }
    }
}
exports.Keyv = Keyv;
const iterableAdapters = ['sqlite', 'postgres', 'mysql', 'mongo', 'redis', 'tiered'];
function toValue(input) {
    return input !== null && typeof input === 'object' && 'value' in input ? input.value : input;
}
//# sourceMappingURL=keyv.js.map