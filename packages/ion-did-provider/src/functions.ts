import { IIonKeyPair, IonKeyMetadata, KeyIdentifierRelation, KeyType } from './types/ion-provider-types'
import {
  IonDid,
  IonDocumentModel,
  IonPublicKeyModel,
  IonPublicKeyPurpose,
  JwkEs256k,
} from '@decentralized-identity/ion-sdk'
import { IKey, ManagedKeyInfo, MinimalImportableKey } from '@veramo/core'
import { keyUtils as secp256k1KeyUtils } from '@transmute/did-key-secp256k1'

import { randomBytes } from '@ethersproject/random'
import * as u8a from 'uint8arrays'
import { generateKeyPair as generateSigningKeyPair } from '@stablelib/ed25519'
import Debug from 'debug'
import { JsonCanonicalizer } from './json-canonicalizer'
import crypto from 'crypto'
import base64url from 'base64url'
import { MemoryPrivateKeyStore } from '@veramo/key-manager'
import { KeyManagementSystem } from '@veramo/kms-local'

const multihashes = require('multihashes')

const debug = Debug('veramo:ion-did-provider')

export function toJwkEs256k(jwk: any): JwkEs256k {
  if (jwk.d) {
    return { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, d: jwk.d }
  } else {
    return { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y }
  }
}

export function toIonPrivateKeyJwk(privateKeyHex: string): JwkEs256k {
  return toJwkEs256k(secp256k1KeyUtils.privateKeyJwkFromPrivateKeyHex(privateKeyHex))
}

export function toIonPublicKeyJwk(publicKeyHex: string): JwkEs256k {
  return toJwkEs256k(secp256k1KeyUtils.publicKeyJwkFromPublicKeyHex(publicKeyHex))
}

export function toIonKeyPair(key: MinimalImportableKey | IKey): IIonKeyPair {
  const privateJwk = key.privateKeyHex ? toIonPrivateKeyJwk(key.privateKeyHex) : undefined
  const publicJwk = key.publicKeyHex ? toIonPublicKeyJwk(key.publicKeyHex) : undefined
  return {
    privateKeyJwk: privateJwk,
    publicKeyJwk: publicJwk,
  }
}

export function ionPublicKeyToCommitment(key: IonPublicKeyModel): string {
  return jwkToCommitment(toJwkEs256k(key.publicKeyJwk))
}

export function jwkToCommitment(jwk: JwkEs256k): string {
  const data = JsonCanonicalizer.asString(jwk)
  debug(`canonicalized JWK: ${data}`)
  const hash = crypto.createHash('sha256').update(data).digest()
  const dhash = crypto.createHash('sha256').update(hash).digest()
  const multihash2 = multihashes.encode(Buffer.from(dhash), 18)
  debug(`commitment: ${base64url.encode(multihash2)}`)
  return base64url.encode(multihash2)
}

/**
 * Get the action Id if present. Use current date/timestamp otherwise
 * @param id The timestamp/action id
 */
export function getActionId(id = Date.now()): number {
  return id
}

export function ionRecoveryKey(keys: IKey[], commitment?: string): IonPublicKeyModel {
  const typedKeys = ionKeysOfType(keys, KeyIdentifierRelation.RECOVERY, commitment)
  return commitment === 'genesis' ? typedKeys[0] : typedKeys[typedKeys.length - 1]
}

export function ionUpdateKey(keys: IKey[], commitment?: string) {
  const typedKeys = ionKeysOfType(keys, KeyIdentifierRelation.UPDATE, commitment)
  return commitment === 'genesis' ? typedKeys[0] : typedKeys[typedKeys.length - 1]
}

export function ionKeysOfType(keys: IKey[], relation: KeyIdentifierRelation, commitment?: string): IonPublicKeyModel[] {
  return keys
    .sort((key1, key2) => {
      const opId1 = key1.meta?.ion?.operationId
      const opId2 = key2.meta?.ion?.operationId
      return !opId1 ? 1 : !opId2 ? -1 : opId1 - opId2
    })
    .filter((key) => !commitment || commitment === 'genesis' || !key.meta?.ion.commitment || key.meta?.ion.commitment === commitment)
    .filter((key) => key.meta?.ion.relation === relation)
    .flatMap((key) => {
      const purposes: IonPublicKeyPurpose[] = key.meta?.ion?.purposes ? key.meta.ion.purposes : []
      return createIonPublicKey(key, purposes)
    })
}

export function truncateKidIfNeeded(kid: string) {
  const id = kid.substring(0, 50) // ION restricts the id to 50 chars. Ideally we can also provide kids for key creation in Veramo
  if (id.length != kid.length) {
    debug(`Key kid ${kid} has been truncated to 50 chars to support ION!`)
  }
  return id
}

export function createIonPublicKey(key: ManagedKeyInfo, purposes: IonPublicKeyPurpose[]): IonPublicKeyModel {
  const publicKeyJwk = toIonPublicKeyJwk(key.publicKeyHex)
  const id = truncateKidIfNeeded(key.kid)

  return {
    id,
    type: 'EcdsaSecp256k1VerificationKey2019',
    publicKeyJwk,
    purposes,
  }
}

export function generatePrivateKeyHex(type: KeyType): string {
  let privateKeyHex: string

  switch (type) {
    case KeyType.Ed25519: {
      const keyPairEd25519 = generateSigningKeyPair()
      privateKeyHex = u8a.toString(keyPairEd25519.secretKey, 'base16')
      break
    }
    case KeyType.Secp256k1: {
      const privateBytes = randomBytes(32)
      privateKeyHex = u8a.toString(privateBytes, 'base16')
      break
    }
    default:
      throw Error('not_supported: Key type not supported: ' + type)
  }
  return privateKeyHex
}

/**
 * Didn't want to recreate the logic to extract the pub key for the different key types
 * So let's create a temp in-mem kms to do it for us
 * @param type
 * @param privateKeyHex
 * @param kid
 * @param kms
 * @param ionMeta
 */

export async function tmpMemoryKey(type: KeyType.Ed25519 | KeyType.Secp256k1 | KeyType, privateKeyHex: string, kid: string, kms: string, ionMeta: IonKeyMetadata): Promise<IKey> {
  const tmpKey = await new KeyManagementSystem(new MemoryPrivateKeyStore()).importKey({
    type,
    privateKeyHex,
    kid,
  }) as IKey
  tmpKey.meta!.ion = JSON.parse(JSON.stringify(ionMeta))
  tmpKey.meta!.ion.commitment = jwkToCommitment(toIonPublicKeyJwk(tmpKey.publicKeyHex))
  tmpKey.kms = kms
  // tmpKey.privateKeyHex = privateKeyHex
  return tmpKey
}

export function ionLongFormDidFromCreation(input: { recoveryKey: JwkEs256k; updateKey: JwkEs256k; document: IonDocumentModel }): string {
  return IonDid.createLongFormDid(input)
}

export function ionShortFormDidFromCreation(input: { recoveryKey: JwkEs256k; updateKey: JwkEs256k; document: IonDocumentModel }): string {
  return ionShortFormDidFromLong(ionLongFormDidFromCreation(input))
}

export function ionShortFormDidFromLong(longFormDid: string): string {
  // Only call this from a long form DID!

  // todo: Add min length check
  return longFormDid.split(':').slice(0, -1).join(':')
}

export function ionDidSuffixFromLong(longFormDid: string): string {
  return ionDidSuffixFromShort(ionShortFormDidFromLong(longFormDid))
}

export function ionDidSuffixFromShort(shortFormDid: string): string {
  const suffix = shortFormDid.split(':').pop()
  if (!suffix) {
    throw new Error(`Could not extrect ion DID suffix from short form DID ${shortFormDid}`)
  }
  return suffix
}
