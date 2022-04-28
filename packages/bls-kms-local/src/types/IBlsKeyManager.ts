import { IPluginMethodMap } from '@veramo/core';
import {IKey, KeyMetadata, MinimalImportableKey, TKeyType} from "./IIdentifier";

export interface IBlsKeyManager extends IPluginMethodMap {
    keyManagerCreate(args: IKeyManagerCreateArgs): Promise<Partial<IKey>>;
    keyManagerGetKeyManagementSystems(): Promise<Array<string>>;
    keyManagerGet({ kid }: IKeyManagerGetArgs): Promise<IKey>;
    keyManagerDelete({ kid }: IKeyManagerDeleteArgs): Promise<boolean>;
    keyManagerImport(key: MinimalImportableKey): Promise<Partial<IKey>>;
    keyManagerSign(args: IKeyManagerSignArgs): Promise<string>;
}

/**
 * Input arguments for {@link IBlsKeyManager.keyManagerCreate | keyManagerCreate}
 * @public
 */
export interface IKeyManagerCreateArgs {
    /**
     * Key type
     */
    type: TKeyType

    /**
     * Key Management System
     */
    kms: string

    /**
     * Optional. Key meta data
     */
    meta?: KeyMetadata
}

/**
* Input arguments for {@link IBlsKeyManager.keyManagerGet | keyManagerGet}
                      * @public
                      */
export interface IKeyManagerGetArgs {
    /**
     * Key ID
     */
    kid: string
}

/**
 * Input arguments for {@link IBlsKeyManager.keyManagerDelete | keyManagerDelete}
 * @public
 */
export interface IKeyManagerDeleteArgs {
    /**
     * Key ID
     */
    kid: string
}

/**
 * Input arguments for {@link IBlsKeyManager.keyManagerSign | keyManagerSign}
 * @public
 */
export interface IKeyManagerSignArgs {
    /**
     * The key handle, as returned during `keyManagerCreateKey`
     */
    keyRef: string

    /**
     * Data to sign
     */
    data: Uint8Array[]
}