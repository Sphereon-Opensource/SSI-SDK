/**
 * This is how the store will actually store the value.
 * It contains an optional `expires` property, which indicates when the value would expire
 */
export interface IValueData<ValueType> {
    value: ValueType | undefined;
    expires: number | undefined;
}
export interface IKeyValueStoreOnArgs {
    eventName: string | symbol;
    listener: (...args: any[]) => void;
}
export interface IKeyValueStoreOptions<ValueType> {
    [key: string]: any;
    /** Namespace for the current instance. */
    namespace?: string | undefined;
    /** A custom serialization function. */
    /** The connection string URI. */
    uri?: string | undefined;
    /** The storage adapter instance to be used by Keyv. or any other implementation */
    store: IKeyValueStoreAdapter<ValueType> | Map<string, ValueType>;
    /** Default TTL. Can be overridden by specifying a TTL on `.set()`. */
    ttl?: number | undefined;
    /** Enable compression option **/
    emitErrors?: boolean;
}
export interface IKeyValueStoreAdapter<ValueType> {
    namespace?: string | undefined;
}
export interface IKeyValueStore<ValueType> {
    /**
     * Get a single value by key. Can be undefined as the underlying store typically will not throw an error for a non existing key
     *
     * @param key Contains the key to search for
     */
    get(key: string): Promise<ValueType | undefined>;
    /**
     * Get a single item as Value Data from the store. Will always return a Value Data Object, but the value in it can be undefined in case the actual store does not contain the value
     * @param key Contains the key to search for
     */
    getAsValueData(key: string): Promise<IValueData<ValueType>>;
    getMany(keys: string[]): Promise<Array<ValueType | undefined>>;
    getManyAsValueData(keys: string[]): Promise<Array<IValueData<ValueType>>>;
    set(key: string, value: ValueType, ttl?: number): Promise<IValueData<ValueType>>;
    delete(key: string): Promise<boolean>;
    deleteMany(keys: string[]): Promise<boolean[]>;
    clear(): Promise<IKeyValueStore<ValueType>>;
    has(key: string): Promise<boolean>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=key-value-types.d.ts.map