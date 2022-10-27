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
export const generatePrivateKeyHex = (type: Key): string => {
  switch (type) {
    case Key.Ed25519: {
      const keyPairEd25519 = generateSigningKeyPair()
      return u8a.toString(keyPairEd25519.secretKey, 'base16')
    }
    case Key.Secp256k1: {
      const privateBytes = randomBytes(32)
      return u8a.toString(privateBytes, 'base16')
    }
    default:
      throw Error(`not_supported: Key type not supported: ${type}`)
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
 * Generates a JWK from a public key
 * @param publicKeyHex Secp256k1 public key in hex
 * @param type The type of the key (Ed25519 / Secp256k1)
 * @param use The use for the key
 * @return The JWK
 */
export const generateJwk = (publicKeyHex: string, type: Key, use?: KeyUse): JsonWebKey => {
  switch (type) {
    case Key.Ed25519:
      return generateEd25519Jwk(publicKeyHex, use)
    case Key.Secp256k1:
      return generateSecp256Jwk(publicKeyHex, KeyCurve.Secp256k1, use)
    case Key.Secp256r1:
      return generateSecp256r1Jwk(publicKeyHex, use)
    default:
      throw new Error('Key type not supported')
  }
}

/**
 * Generates a JWK from a Secp256k1 public key
 * @param publicKeyHex Secp256k1 public key in hex
 * @param keyCurve The key curve to use Secp256k1 or P-256
 * @param use The use for the key
 * @return The JWK
 */
const generateSecp256Jwk = (publicKeyHex: string, keyCurve: KeyCurve.Secp256k1 | KeyCurve.P_256, use?: KeyUse): JsonWebKey => {
  return {
    ...(use !== undefined && { use }),
    kty: KeyType.EC,
    crv: keyCurve,
    x: hex2base64url(publicKeyHex.substr(2, 64)),
    y: hex2base64url(publicKeyHex.substr(66, 64)),
  }
}

/**
 * Generates a JWK from a Secp256k1 public key
 * @param publicKeyHex Secp256k1 public key in hex
 * @param keyCurve The key curve to use Secp256k1 or P-256
 * @param use The use for the key
 * @return The JWK
 */
const generateSecp256r1Jwk = (publicKeyHex: string, use?: KeyUse): JsonWebKey => {
  // const privateBytes = u8a.fromString(args.privateKeyHex.toLowerCase(), 'base16')
  const secp256r1 = new elliptic.ec('p256')
  const publicKey = `03${publicKeyHex}` // We add the 'compressed' type 03 prefix
  const key = secp256r1.keyFromPublic(publicKey, 'hex')
  var pubPoint = key.getPublic()
  var x = pubPoint.getX()
  var y = pubPoint.getY()
  return {
    ...(use !== undefined && { use }),
    kty: KeyType.EC,
    crv: KeyCurve.P_256,
    x: hex2base64url(x.toString('hex')),
    y: hex2base64url(y.toString('hex')),
  }
}

/**
 * Generates a JWK from an Ed25519 public key
 * @param publicKeyHex Ed25519 public key in hex
 * @param use The use for the key
 * @return The JWK
 */
const generateEd25519Jwk = (publicKeyHex: string, use?: KeyUse): JsonWebKey => {
  return {
    ...(use !== undefined && { use }),
    kty: KeyType.OKP,
    crv: KeyCurve.Ed25519,
    x: hex2base64url(publicKeyHex.substr(0, 64)),
  }
}

export const determineUse = (type: TKeyType, suppliedUse?: KeyUse): KeyUse | undefined => {
  return suppliedUse ? suppliedUse : SIG_KEY_ALGS.includes(type) ? KeyUse.Signature : ENC_KEY_ALGS.includes(type) ? KeyUse.Encryption : undefined
}
