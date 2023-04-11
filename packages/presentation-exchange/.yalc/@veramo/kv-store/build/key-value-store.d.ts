import { IKeyValueStore, IKeyValueStoreOnArgs, IKeyValueStoreOptions, IValueData } from './key-value-types';
/**
 * Agent plugin that implements {@link @veramo/kv-store#IKeyValueStore} interface
 * @public
 */
export declare class KeyValueStore<ValueType> implements IKeyValueStore<ValueType> {
    /**
     * The main keyv typescript port which delegates to the storage adapters and takes care of some common functionality
     *
     * @private
     */
    private readonly keyv;
    constructor(options: IKeyValueStoreOptions<ValueType>);
    get(key: string): Promise<ValueType | undefined>;
    getAsValueData(key: string): Promise<IValueData<ValueType>>;
    getMany(keys: string[]): Promise<Array<ValueType | undefined>>;
    getManyAsValueData(keys: string[]): Promise<Array<IValueData<ValueType>>>;
    set(key: string, value: ValueType, ttl?: number): Promise<IValueData<ValueType>>;
    has(key: string): Promise<boolean>;
    delete(key: string): Promise<boolean>;
    deleteMany(keys: string[]): Promise<boolean[]>;
    clear(): Promise<IKeyValueStore<ValueType>>;
    disconnect(): Promise<void>;
    kvStoreOn(args: IKeyValueStoreOnArgs): Promise<IKeyValueStore<ValueType>>;
    private toDeserializedValueData;
}
//# sourceMappingURL=key-value-store.d.ts.map