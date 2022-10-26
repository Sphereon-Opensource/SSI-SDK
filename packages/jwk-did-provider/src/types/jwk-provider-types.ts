import { IAgentContext, IIdentifier, IKey, IKeyManager, IService, MinimalImportableKey } from '@veramo/core'

export interface IKeyOpts {
  key?: MinimalImportableKey // Optional key to import. If not specified a key with random kid will be created
  type?: Key // The key type. Defaults to Secp256k1
  use?: KeyUse // The key use
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

export enum Key {
  Ed25519 = 'Ed25519',
  Secp256k1 = 'Secp256k1',
}

export enum KeyUse {
  Encryption = 'enc',
  Signature = 'sig',
}

export enum KeyCurve {
  Secp256k1 = 'secp256k1',
  Ed25519 = 'Ed25519',
}

export enum KeyType {
  EC = 'EC',
  OKP = 'OKP',
}

export enum VerificationType {
  JsonWebKey2020 = 'JsonWebKey2020',
}

export type IRequiredContext = IAgentContext<IKeyManager>
