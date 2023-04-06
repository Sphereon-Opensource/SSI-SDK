import { IKeyValueStoreAdapter } from '../../key-value-types.js';
export type Options<ValueType> = {
    local: IKeyValueStoreAdapter<ValueType> | Map<string, ValueType>;
    remote: IKeyValueStoreAdapter<ValueType> | Map<string, ValueType>;
    localOnly?: boolean;
    iterationLimit?: number | string;
};
export type Options_ = {
    validator: (value: any, key: string) => boolean;
    dialect: string;
    iterationLimit?: number | string;
    localOnly?: boolean;
};
//# sourceMappingURL=types.d.ts.map