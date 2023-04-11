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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyValueTieredStoreAdapter = void 0;
const events_1 = require("events");
const keyv_1 = require("../../keyv/keyv");
class KeyValueTieredStoreAdapter extends events_1.EventEmitter {
    constructor(_a) {
        var { remote, local } = _a, options = __rest(_a, ["remote", "local"]);
        super();
        this.opts = Object.assign({ validator: () => true, dialect: 'tiered' }, options);
        // todo: since we are instantiating a new Keyv object in case we encounter a map, the key prefix applied twice, given it will be part of a an outer keyv object as well.
        // Probably wise to simply create a Map Store class. As it is an in memory construct, and will work in terms of resolution it does not have highest priority
        this.local = (isMap(local) ? new keyv_1.Keyv(local) : local);
        this.remote = (isMap(remote) ? new keyv_1.Keyv(remote) : remote);
        this.namespace = this.local.namespace;
    }
    get(key, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(key)) {
                return yield this.getMany(key, options);
            }
            const localResult = (yield this.local.get(key, options));
            if (localResult === undefined || !this.opts.validator(localResult, key)) {
                const remoteResult = yield this.remote.get(key, options);
                if (remoteResult !== localResult) {
                    const value = (!!remoteResult
                        ? typeof remoteResult === 'object' && 'value' in remoteResult
                            ? remoteResult.value
                            : remoteResult
                        : undefined);
                    const ttl = !!remoteResult &&
                        typeof remoteResult === 'object' &&
                        'expires' in remoteResult &&
                        remoteResult.expires
                        ? remoteResult.expires - Date.now()
                        : undefined;
                    if (!ttl || ttl > 0) {
                        yield this.local.set(key, value, ttl);
                    }
                    else {
                        this.local.delete(key);
                    }
                }
                return remoteResult;
            }
            return localResult;
        });
    }
    getMany(keys, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = [];
            for (const key of keys) {
                promises.push(this.get(key, options));
            }
            const values = yield Promise.all(promises);
            const data = [];
            for (const value of values) {
                data.push(value);
            }
            return data;
        });
    }
    set(key, value, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            const toSet = ['local', 'remote'];
            return Promise.all(toSet.map((store) => __awaiter(this, void 0, void 0, function* () { return this[store].set(key, value, ttl); })));
        });
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            const toClear = ['local'];
            if (!this.opts.localOnly) {
                toClear.push('remote');
            }
            yield Promise.all(toClear.map((store) => __awaiter(this, void 0, void 0, function* () { return this[store].clear(); })));
            return undefined;
        });
    }
    delete(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const toDelete = ['local'];
            if (!this.opts.localOnly) {
                toDelete.push('remote');
            }
            const deleted = yield Promise.all(toDelete.map((store) => __awaiter(this, void 0, void 0, function* () { return this[store].delete(key); })));
            return deleted.every(Boolean);
        });
    }
    deleteMany(keys) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = [];
            for (const key of keys) {
                promises.push(this.delete(key));
            }
            const values = yield Promise.all(promises);
            return values.every(Boolean);
        });
    }
    has(key) {
        return __awaiter(this, void 0, void 0, function* () {
            let response;
            if (typeof this.local.has === 'function') {
                response = this.local.has(key);
            }
            else {
                const value = yield this.local.get(key);
                response = value !== undefined;
            }
            if (!response || !this.opts.validator(response, key)) {
                if (typeof this.remote.has === 'function') {
                    response = this.remote.has(key);
                }
                else {
                    const value = yield this.remote.get(key);
                    response = value !== undefined;
                }
            }
            return response;
        });
    }
    iterator(namespace) {
        return __asyncGenerator(this, arguments, function* iterator_1() {
            var _a, e_1, _b, _c;
            const limit = Number.parseInt(this.iterationLimit, 10) || 10;
            this.remote.opts.iterationLimit = limit;
            if (this.remote && typeof this.remote.iterator === 'function') {
                try {
                    for (var _d = true, _e = __asyncValues(this.remote.iterator(namespace)), _f; _f = yield __await(_e.next()), _a = _f.done, !_a;) {
                        _c = _f.value;
                        _d = false;
                        try {
                            const entries = _c;
                            yield yield __await(entries);
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
            }
        });
    }
}
exports.KeyValueTieredStoreAdapter = KeyValueTieredStoreAdapter;
function isMap(map) {
    if (map instanceof Map) {
        return true;
    }
    else if (map &&
        typeof map.clear === 'function' &&
        typeof map.delete === 'function' &&
        typeof map.get === 'function' &&
        typeof map.has === 'function' &&
        typeof map.set === 'function') {
        return true;
    }
    return false;
}
//# sourceMappingURL=index.js.map