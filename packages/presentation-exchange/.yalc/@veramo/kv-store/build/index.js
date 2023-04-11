"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyValueStore = void 0;
/**
 * Provides a {@link @veramo/kv-store#KeyValueStore} for the
 * {@link @veramo/core#Agent} plugin that implements {@link @veramo/kv-store#IKeyValueStore} interface
 *
 * @packageDocumentation
 */
var key_value_store_1 = require("./key-value-store");
Object.defineProperty(exports, "KeyValueStore", { enumerable: true, get: function () { return key_value_store_1.KeyValueStore; } });
__exportStar(require("./store-adapters/tiered/index"), exports);
__exportStar(require("./store-adapters/typeorm/index"), exports);
__exportStar(require("./key-value-types"), exports);
//# sourceMappingURL=index.js.map