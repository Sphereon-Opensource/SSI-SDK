import { IAgentContext, IIdentifier, IKey, IKeyManager, IService, MinimalImportableKey } from '@veramo/core'

export interface IKeyOpts {
  kid?: string // Key ID to assign in case we are importing a key
  key?: MinimalImportableKey // Optional key to import. If not specified a key with random kid will be created
  type?: KeyType // The key type. Defaults to Secp256k1
  use?: KeyUse
}

export interface ICreateIdentifierArgs {
  kms?: string
  alias?: string
  options?: IKeyOpts
}

export interface IAddKeyArgs {
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
}

export interface IImportProvidedOrGeneratedKeyArgs {
  kms?: string
  options?: IKeyOpts
}

export enum KeyType {
  Ed25519 = 'Ed25519',
  Secp256k1 = 'Secp256k1',
}

export enum KeyUse {
  Encryption = 'enc',
  Signature = 'sig',
}


export type IRequiredContext = IAgentContext<IKeyManager>
