/// <reference types="node" />
import { EventEmitter } from 'events';
import { KeyvDeserializedData, KeyvOptions, KeyvStore, KeyvStoredData } from './keyv-types';
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
export declare class Keyv<Value = any> extends EventEmitter implements KeyvStore<Value> {
    readonly opts: KeyvOptions<Value>;
    readonly namespace: string;
    iterator?: (namespace?: string) => AsyncGenerator<any, void>;
    constructor(uri?: string | Map<string, Value | undefined> | KeyvStore<Value> | undefined, options?: KeyvOptions<Value>);
    get store(): Required<KeyvStore<Value>>;
    get deserialize(): (data: any) => import("@veramo/utils").OrPromise<KeyvDeserializedData<Value> | undefined>;
    get serialize(): (data: KeyvDeserializedData<Value>) => import("@veramo/utils").OrPromise<string | undefined>;
    _checkIterableAdapter(): any;
    _getKeyPrefix(key: string): string;
    _getKeyPrefixArray(keys: string[]): string[];
    _getKeyUnprefix(key: string): string;
    getMany(keys: string[], options?: {
        raw?: boolean;
    }): Promise<Array<KeyvStoredData<Value>>>;
    get(key: string | string[], options?: {
        raw?: boolean;
    }): Promise<Value | string | KeyvDeserializedData<Value> | KeyvStoredData<Value>[] | undefined>;
    private isExpired;
    set(key: string, value: Value, ttl?: number): Promise<boolean>;
    delete(key: string | string[]): Promise<boolean>;
    clear(): Promise<void>;
    has(key: string): Promise<boolean>;
    disconnect(): void;
}
//# sourceMappingURL=keyv.d.ts.map