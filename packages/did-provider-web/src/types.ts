import { X509Opts } from '@sphereon/ssi-sdk-ext.key-utils'
import { IAgentContext, IDIDManager, IKeyManager, IService, MinimalImportableKey, TKeyType } from '@veramo/core'

export interface IKeyOpts {
  key?: Partial<MinimalImportableKey> // Optional key to import with only privateKeyHex mandatory. If not specified a key with random kid will be created
  x509?: X509Opts
  type?: TKeyType | 'RSA' // The key type. Defaults to Secp256k1
  isController?: boolean // Whether this is a controller key for a DID document. Please note that only one key can be a controller key. If multiple are supplied, the first one will be used!
}

/*
// Needed to make a single property required
type WithRequiredProperty<Type, Key extends keyof Type> = Type & {
  [Property in Key]-?: Type[Property]
}
*/

/*export interface IAddKeyArgs {
    identifier: IIdentifier
    key: IKey
    options?: any
}

export interface IRemoveKeyArgs {
    identifier: IIdentifier
    id: string
    options?: any
}

export interface IRemoveKeyArgs {
    identifier: IIdentifier
    kid: string
    options?: any
}

export interface IAddServiceArgs {
    identifier: IIdentifier
    service: IService
    options?: any
}*/

export interface IImportProvidedOrGeneratedKeyArgs {
  kms?: string
  options?: IKeyOpts
}

/*

export interface IImportX509DIDArg {
    alias: string
    privateKeyPEM: string
    certificatePEM: string
    certificateChainPEM: string
    certificateChainURL?: string
    kms?: string // The Key Management System to use. Will default to the default KMS when not supplied.
    // kid?: string // The requested KID. A default will be generated when not supplied
}*/

export interface ICreateIdentifierArgs {
  kms?: string
  alias: string
  options?: { keys?: IKeyOpts | IKeyOpts[]; services?: IService[] }
}

export type IRequiredContext = IAgentContext<IKeyManager & IDIDManager>
