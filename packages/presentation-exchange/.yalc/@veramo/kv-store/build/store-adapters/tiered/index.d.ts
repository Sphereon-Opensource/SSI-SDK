/// <reference types="node" />
import { EventEmitter } from 'events';
import type { Options, Options_ } from './types';
import { KeyvStore, KeyvStoredData } from '../../keyv/keyv-types';
import { IKeyValueStoreAdapter } from '../../key-value-types';
export declare class KeyValueTieredStoreAdapter<Value> extends EventEmitter implements KeyvStore<Value>, IKeyValueStoreAdapter<Value> {
    opts: Options_;
    remote: KeyvStore<Value>;
    local: KeyvStore<Value>;
    iterationLimit?: string | number;
    namespace?: string | undefined;
    constructor({ remote, local, ...options }: Options<Value>);
    get(key: string | string[], options?: {
        raw?: boolean;
    }): Promise<KeyvStoredData<Value> | Array<KeyvStoredData<Value>>>;
    getMany(keys: string[], options?: {
        raw?: boolean;
    }): Promise<Array<KeyvStoredData<Value>>>;
    set(key: string, value: any, ttl?: number): Promise<any[]>;
    clear(): Promise<undefined>;
    delete(key: string): Promise<boolean>;
    deleteMany(keys: string[]): Promise<boolean>;
    has(key: string): Promise<boolean>;
    iterator(namespace?: string): AsyncGenerator<any, void, any>;
}
//# sourceMappingURL=index.d.ts.map