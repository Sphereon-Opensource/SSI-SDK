import type { IKey, MinimalImportableKey, TKeyType } from '@veramo/core'
import type { StoreKey } from '@sphereon/ssi-sdk.kms-rest-client'
import type { JWK } from '@sphereon/ssi-types'

export type KeyMetadata = {
  algorithms?: string[]
  [x: string]: any
}

export type CreateKeyArgs = {
  type: TKeyType
  meta?: KeyMetadata
}

export type SignArgs = {
  keyRef: Pick<IKey, 'kid'>
  data: Uint8Array
  [x: string]: any
}

export type VerifyArgs = {
  keyRef: Pick<IKey, 'kid'>
  data: Uint8Array
  signature: string
  [x: string]: any
}

export type SharedSecretArgs = {
  myKeyRef: Pick<IKey, 'kid'>
  theirKey: Pick<IKey, 'publicKeyHex' | 'type'>
}

export type ImportKeyArgs = Omit<MinimalImportableKey, 'kms'> & { privateKeyPEM?: string }

export type DeleteKeyArgs = {
  kid: string
}

export type MapImportKeyArgs = {
  type: TKeyType
  privateKeyHex: string
  meta?: KeyMetadata | null
  kid?: string
}

export type MappedImportKey = {
  key: StoreKey
  kid: string
  publicKeyJwk: JWK
}
