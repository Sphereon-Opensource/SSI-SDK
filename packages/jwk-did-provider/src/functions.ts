import { randomBytes } from '@ethersproject/random'
import { generateKeyPair as generateSigningKeyPair } from '@stablelib/ed25519'
import { TKeyType } from '@veramo/core'
import { JsonWebKey } from 'did-resolver'
import * as u8a from 'uint8arrays'
import { ENC_KEY_ALGS, Key, KeyCurve, KeyType, KeyUse, SIG_KEY_ALGS } from './types/jwk-provider-types'
import elliptic from 'elliptic'

/**
 * Generates a random Private Hex Key for the specified key type
 * @param type The key type
 * @return The private key in Hex form
 */
export const generatePrivateKeyHex = (type: TKeyType): string => {
  switch (type) {
    case Key.Ed25519: {
      const keyPairEd25519 = generateSigningKeyPair()
      return u8a.toString(keyPairEd25519.secretKey, 'base16')
    }
    // The Secp256 types use the same method to generate the key
    case Key.Secp256r1:
    case Key.Secp256k1: {
      const privateBytes = randomBytes(32)
      return u8a.toString(privateBytes, 'base16')
    }
    default:
      throw Error(`not_supported: Key type ${type} not yet supported for this did:jwk implementation`)
  }
}

/**
 * Converts hex value to base64url
 * @param value hex value
 * @return Base64Url encoded value
 */
export const hex2base64url = (value: string) => {
  const buffer = Buffer.from(value, 'hex')
  const base64 = buffer.toString('base64')
  const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  return base64url
}

/**
 * Converts a public key in hex format to a JWK
 * @param publicKeyHex public key in hex
 * @param type The type of the key (Ed25519, Secp256k1/r1)
 * @param use The optional use for the key (sig/enc)
 * @return The JWK
 */
export const toJwk = (publicKeyHex: string, type: TKeyType, use?: KeyUse): JsonWebKey => {
  switch (type) {
    case Key.Ed25519:
      return toEd25519Jwk(publicKeyHex, use)
    case Key.Secp256k1:
      return toSecp256k1Jwk(publicKeyHex, use)
    case Key.Secp256r1:
      return toSecp256r1Jwk(publicKeyHex, use)
    default:
      throw new Error(`not_supported: Key type ${type} not yet supported for this did:jwk implementation`)
  }
}

/**
 * Determines the use param based upon the key/signature type or supplied use value.
 *
 * @param type The key type
 * @param suppliedUse A supplied use. Will be used in case it is present
 */
export const determineUse = (type: TKeyType, suppliedUse?: KeyUse): KeyUse | undefined => {
  return suppliedUse ? suppliedUse : SIG_KEY_ALGS.includes(type) ? KeyUse.Signature : ENC_KEY_ALGS.includes(type) ? KeyUse.Encryption : undefined
}

/**
 * Assert the key has a proper length
 *
 * @param keyHex Input key
 * @param expectedKeyLength Expected key length
 */
const assertProperKeyLength = (keyHex: string, expectedKeyLength: number) => {
  if (keyHex.length !== expectedKeyLength) {
    throw Error(`Invalid key length. Needs to be a hex string with length ${expectedKeyLength} instead of ${keyHex.length}. Input: ${keyHex}`)
  }
}

/**
 * Generates a JWK from a Secp256k1 public key
 * @param publicKeyHex Secp256k1 public key in hex
 * @param use The use for the key
 * @return The JWK
 */
const toSecp256k1Jwk = (publicKeyHex: string, use?: KeyUse): JsonWebKey => {
  assertProperKeyLength(publicKeyHex, 130)
  return {
    alg: 'ES256K',
    ...(use !== undefined && { use }),
    kty: KeyType.EC,
    crv: KeyCurve.Secp256k1,
    x: hex2base64url(publicKeyHex.substr(2, 64)),
    y: hex2base64url(publicKeyHex.substr(66, 64)),
  }
}

/**
 * Generates a JWK from a Secp256r1 public key
 * @param publicKeyHex Secp256r1 public key in hex
 * @param use The use for the key
 * @return The JWK
 */
const toSecp256r1Jwk = (publicKeyHex: string, use?: KeyUse): JsonWebKey => {
  assertProperKeyLength(publicKeyHex, 64)
  const secp256r1 = new elliptic.ec('p256')
  const publicKey = `03${publicKeyHex}` // We add the 'compressed' type 03 prefix
  const key = secp256r1.keyFromPublic(publicKey, 'hex')
  const pubPoint = key.getPublic()
  return {
    alg: 'ES256',
    ...(use !== undefined && { use }),
    kty: KeyType.EC,
    crv: KeyCurve.P_256,
    x: hex2base64url(pubPoint.getX().toString('hex')),
    y: hex2base64url(pubPoint.getY().toString('hex')),
  }
}

/**
 * Generates a JWK from an Ed25519 public key
 * @param publicKeyHex Ed25519 public key in hex
 * @param use The use for the key
 * @return The JWK
 */
const toEd25519Jwk = (publicKeyHex: string, use?: KeyUse): JsonWebKey => {
  assertProperKeyLength(publicKeyHex, 64)
  return {
    alg: 'EdDSA',
    ...(use !== undefined && { use }),
    kty: KeyType.OKP,
    crv: KeyCurve.Ed25519,
    x: hex2base64url(publicKeyHex.substr(0, 64)),
  }
}
