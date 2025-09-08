import { IKey, TKeyType } from '@veramo/core'

export type OydConstructorOptions = {
  defaultKms?: string
  clientManagedSecretMode?: CMSMCallbackOpts
}

export type OydCreateIdentifierOptions = {
  type?: OydDidSupportedKeyTypes
  privateKeyHex?: string
  kid?: string
  alias?: string
  keyUse?: KeyUse
  cmsm?: CmsmOptions
  key?: IKey // Use the supplied key instead of looking it up in the KMS or creating a new one
}

export type CmsmOptions = {
  enabled: boolean
  create?: boolean
}

export type OydDidHoldKeysArgs = {
  kms?: string
  options: HoldKeysOpts
}

type HoldKeysOpts = {
  keyType: OydDidSupportedKeyTypes
  kid: string
  publicKeyHex?: string
  privateKeyHex?: string
}

export type CMSMCallbackOpts = {
  publicKeyCallback: (kid: string, kms?: string, create?: boolean, createKeyType?: TKeyType) => Promise<IKey>
  signCallback: (kid: string, value: string) => Promise<string>
}

enum SupportedKeyTypes {
  Secp256r1 = 'Secp256r1',
  Secp256k1 = 'Secp256k1',
  Ed25519 = 'Ed25519',
  X25519 = 'X25519',
}

export type OydDidSupportedKeyTypes = keyof typeof SupportedKeyTypes

export type KeyUse = 'sig' | 'enc'
