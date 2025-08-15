import { randomBytes } from '@ethersproject/random'
// Do not change these require statements to imports before we change to ESM. Breaks external CJS packages depending on this module
import { bls12_381 } from '@noble/curves/bls12-381'
import { ed25519 } from '@noble/curves/ed25519'
import { p256 } from '@noble/curves/p256'
import { p384 } from '@noble/curves/p384'
import { p521 } from '@noble/curves/p521'
import { secp256k1 } from '@noble/curves/secp256k1'
import { sha256, sha384, sha512 } from '@noble/hashes/sha2'
import {
  cryptoSubtleImportRSAKey,
  generateRSAKeyAsPEM,
  hexToBase64,
  hexToPEM,
  PEMToJwk,
  privateKeyHexFromPEM,
} from '@sphereon/ssi-sdk-ext.x509-utils'
import { JoseCurve, JoseSignatureAlgorithm, type JWK, JwkKeyType, Loggers } from '@sphereon/ssi-types'
import { generateKeyPair as generateSigningKeyPair } from '@stablelib/ed25519'
import type { IAgentContext, IKey, IKeyManager, ManagedKeyInfo, MinimalImportableKey } from '@veramo/core'
import debug from 'debug'

import type { JsonWebKey } from 'did-resolver'
import elliptic from 'elliptic'
import * as rsa from 'micro-rsa-dsa-dh/rsa.js'

// @ts-ignore
import { Crypto } from 'node'
// @ts-ignore
import * as u8a from 'uint8arrays'
import { digestMethodParams } from './digest-methods'
import { validateJwk } from './jwk-jcs'
import {
  ENC_KEY_ALGS,
  type IImportProvidedOrGeneratedKeyArgs,
  JwkKeyUse,
  type KeyTypeFromCryptographicSuiteArgs,
  SIG_KEY_ALGS,
  type SignatureAlgorithmFromKeyArgs,
  type SignatureAlgorithmFromKeyTypeArgs,
  type TKeyType,
} from './types'

const { fromString, toString } = u8a

export const logger = Loggers.DEFAULT.get('sphereon:key-utils')

/**
 * Function that returns the provided KMS name or the default KMS name if none is provided.
 * The default KMS is either explicitly defined during agent construction, or the first KMS available in the system
 * @param context
 * @param kms. Optional KMS to use. If provided will be the returned name. Otherwise the default KMS will be returned
 */
export const getKms = async (context: IAgentContext<any>, kms?: string): Promise<string> => {
  if (kms) {
    return kms
  }
  if (!context.agent.availableMethods().includes('keyManagerGetDefaultKeyManagementSystem')) {
    throw Error('Cannot determine default KMS if not provided and a non Sphereon Key Manager is being used')
  }
  return context.agent.keyManagerGetDefaultKeyManagementSystem()
}

/**
 * Generates a random Private Hex Key for the specified key type
 * @param type The key type
 * @return The private key in Hex form
 */
export const generatePrivateKeyHex = async (type: TKeyType): Promise<string> => {
  switch (type) {
    case 'Ed25519': {
      const keyPairEd25519 = generateSigningKeyPair()
      return toString(keyPairEd25519.secretKey, 'base16')
    }
    // The Secp256 types use the same method to generate the key
    case 'Secp256r1':
    case 'Secp256k1': {
      const privateBytes = randomBytes(32)
      return toString(privateBytes, 'base16')
    }
    case 'RSA': {
      const pem = await generateRSAKeyAsPEM('RSA-PSS', 'SHA-256', 2048)
      return privateKeyHexFromPEM(pem)
    }
    default:
      throw Error(`not_supported: Key type ${type} not yet supported for this did:jwk implementation`)
  }
}

const keyMetaAlgorithmsFromKeyType = (type: string | TKeyType) => {
  switch (type) {
    case 'Ed25519':
      return ['Ed25519', 'EdDSA']
    case 'ES256K':
    case 'Secp256k1':
      return ['ES256K', 'ES256K-R', 'eth_signTransaction', 'eth_signTypedData', 'eth_signMessage', 'eth_rawSign']
    case 'Secp256r1':
      return ['ES256']
    case 'X25519':
      return ['ECDH', 'ECDH-ES', 'ECDH-1PU']
    case 'RSA':
      return ['RS256', 'RS512', 'PS256', 'PS512']
  }
  return [type]
}

/**
 * We optionally generate and then import our own keys.
 *
 * @param args The key arguments
 * @param context The Veramo agent context
 * @private
 */
export async function importProvidedOrGeneratedKey(
  args: IImportProvidedOrGeneratedKeyArgs & {
    kms: string
  },
  context: IAgentContext<IKeyManager>
): Promise<IKey> {
  // @ts-ignore
  const type = args.options?.type ?? args.options?.key?.type ?? args.options?.keyType ?? 'Secp256r1'
  const key = args?.options?.key
  // Make sure x509 options are also set on the metadata as that is what the kms will look for
  if (args.options?.x509 && key) {
    key.meta = {
      ...key.meta,
      x509: {
        ...args.options.x509,
        ...key.meta?.x509,
      },
    }
  }

  if (args.options && args.options?.use === JwkKeyUse.Encryption && !ENC_KEY_ALGS.includes(type)) {
    throw new Error(`${type} keys are not valid for encryption`)
  }

  let privateKeyHex: string | undefined = undefined
  if (key) {
    privateKeyHex = key.privateKeyHex ?? key.meta?.x509?.privateKeyHex
    if ((!privateKeyHex || privateKeyHex.trim() === '') && key?.meta?.x509?.privateKeyPEM) {
      // If we do not have a privateKeyHex but do have a PEM
      privateKeyHex = privateKeyHexFromPEM(key.meta.x509.privateKeyPEM)
    }
  }
  if (privateKeyHex) {
    return context.agent.keyManagerImport({
      ...key,
      kms: args.kms,
      type,
      privateKeyHex: privateKeyHex!,
    })
  }

  return context.agent.keyManagerCreate({
    type,
    kms: args.kms,
    meta: {
      ...key?.meta,
      algorithms: keyMetaAlgorithmsFromKeyType(type),
      keyAlias: args.alias,
    },
  })
}

export const calculateJwkThumbprintForKey = (args: {
  key: IKey | MinimalImportableKey | ManagedKeyInfo
  digestAlgorithm?: 'sha256' | 'sha512'
}): string => {
  const { key } = args

  const jwk = key.publicKeyHex
    ? toJwk(key.publicKeyHex, key.type, { key: key, isPrivateKey: false })
    : 'privateKeyHex' in key && key.privateKeyHex
    ? toJwk(key.privateKeyHex, key.type, { isPrivateKey: true })
    : undefined
  if (!jwk) {
    throw Error(`Could not determine jwk from key ${key.kid}`)
  }
  return calculateJwkThumbprint({ jwk, digestAlgorithm: args.digestAlgorithm })
}

const assertJwkClaimPresent = (value: unknown, description: string) => {
  if (typeof value !== 'string' || !value) {
    throw new Error(`${description} missing or invalid`)
  }
}
export const toBase64url = (input: string): string => toString(fromString(input), 'base64url')

/**
 * Calculate the JWK thumbprint
 * @param args
 */
export const calculateJwkThumbprint = (args: { jwk: JWK; digestAlgorithm?: 'sha256' | 'sha512' }): string => {
  const { digestAlgorithm = 'sha256' } = args
  const jwk = sanitizedJwk(args.jwk)
  let components
  switch (jwk.kty) {
    case 'EC':
      assertJwkClaimPresent(jwk.crv, '"crv" (Curve) Parameter')
      assertJwkClaimPresent(jwk.x, '"x" (X Coordinate) Parameter')
      assertJwkClaimPresent(jwk.y, '"y" (Y Coordinate) Parameter')
      components = { crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y }
      break
    case 'OKP':
      assertJwkClaimPresent(jwk.crv, '"crv" (Subtype of Key Pair) Parameter')
      assertJwkClaimPresent(jwk.x, '"x" (Public Key) Parameter')
      components = { crv: jwk.crv, kty: jwk.kty, x: jwk.x }
      break
    case 'RSA':
      assertJwkClaimPresent(jwk.e, '"e" (Exponent) Parameter')
      assertJwkClaimPresent(jwk.n, '"n" (Modulus) Parameter')
      components = { e: jwk.e, kty: jwk.kty, n: jwk.n }
      break
    case 'oct':
      assertJwkClaimPresent(jwk.k, '"k" (Key Value) Parameter')
      components = { k: jwk.k, kty: jwk.kty }
      break
    default:
      throw new Error('"kty" (Key Type) Parameter missing or unsupported')
  }
  const data = JSON.stringify(components)

  return digestAlgorithm === 'sha512'
    ? digestMethodParams('SHA-512').digestMethod(data, 'base64url')
    : digestMethodParams('SHA-256').digestMethod(data, 'base64url')
}

export const toJwkFromKey = (
  key: IKey | MinimalImportableKey | ManagedKeyInfo,
  opts?: {
    use?: JwkKeyUse
    noKidThumbprint?: boolean
  }
): JWK => {
  const isPrivateKey = 'privateKeyHex' in key
  return toJwk(key.publicKeyHex!, key.type, { ...opts, key, isPrivateKey })
}

/**
 * Converts a public key in hex format to a JWK
 * @param publicKeyHex public key in hex
 * @param type The type of the key (Ed25519, Secp256k1/r1)
 * @param opts. Options, like the optional use for the key (sig/enc)
 * @return The JWK
 */
export const toJwk = (
  publicKeyHex: string,
  type: TKeyType,
  opts?: { use?: JwkKeyUse; key?: IKey | MinimalImportableKey; isPrivateKey?: boolean; noKidThumbprint?: boolean }
): JWK => {
  const { key, noKidThumbprint = false } = opts ?? {}
  if (key && key.publicKeyHex !== publicKeyHex && opts?.isPrivateKey !== true) {
    throw Error(`Provided key with id ${key.kid}, has a different public key hex ${key.publicKeyHex} than supplied public key ${publicKeyHex}`)
  }
  let jwk: JWK
  switch (type) {
    case 'Ed25519':
      jwk = toEd25519OrX25519Jwk(publicKeyHex, { ...opts, crv: JoseCurve.Ed25519 })
      break
    case 'X25519':
      jwk = toEd25519OrX25519Jwk(publicKeyHex, { ...opts, crv: JoseCurve.X25519 })
      break
    case 'Secp256k1':
      jwk = toSecp256k1Jwk(publicKeyHex, opts)
      break
    case 'Secp256r1':
      jwk = toSecp256r1Jwk(publicKeyHex, opts)
      break
    case 'RSA':
      jwk = toRSAJwk(publicKeyHex, opts)
      break
    default:
      throw new Error(`not_supported: Key type ${type} not yet supported for this did:jwk implementation`)
  }
  if (!jwk.kid && !noKidThumbprint) {
    jwk['kid'] = calculateJwkThumbprint({ jwk })
  }
  return sanitizedJwk(jwk)
}

/**
 * Convert a JWK to a raw hex key.
 * Currently supports `RSA` and `EC` keys. Extendable for other key types.
 * @param jwk - The JSON Web Key object.
 * @returns A string representing the key in raw hexadecimal format.
 */
export const jwkToRawHexKey = async (jwk: JWK): Promise<string> => {
  // TODO: Probably makes sense to have an option to do the same for private keys
  jwk = sanitizedJwk(jwk)
  if (jwk.kty === 'RSA') {
    return rsaJwkToRawHexKey(jwk)
  } else if (jwk.kty === 'EC') {
    return ecJwkToRawHexKey(jwk)
  } else if (jwk.kty === 'OKP') {
    return okpJwkToRawHexKey(jwk)
  } else if (jwk.kty === 'oct') {
    return octJwkToRawHexKey(jwk)
  } else {
    throw new Error(`Unsupported key type: ${jwk.kty}`)
  }
}

/**
 * Convert an RSA JWK to a raw hex key.
 * @param jwk - The RSA JWK object.
 * @returns A string representing the RSA key in raw hexadecimal format.
 */
export function rsaJwkToRawHexKey(jwk: JsonWebKey): string {
  /**
   * Encode an integer value (given as a Uint8Array) into DER INTEGER:
   * 0x02 || length || value (with a leading 0x00 if the high bit is set).
   */
  function encodeInteger(bytes: Uint8Array): Uint8Array {
    // if high bit set, prefix a 0x00
    if (bytes[0] & 0x80) {
      bytes = Uint8Array.from([0x00, ...bytes])
    }
    const len = encodeLength(bytes.length)
    return Uint8Array.from([0x02, ...len, ...bytes])
  }

  /**
   * Encode length per DER rules:
   * - If <128, one byte
   * - Else 0x80|numBytes followed by big-endian length
   */
  function encodeLength(len: any) {
    if (len < 0x80) {
      return Uint8Array.of(len)
    }
    let hex = len.toString(16)
    if (hex.length % 2 === 1) {
      hex = '0' + hex
    }
    const lenBytes = Uint8Array.from(hex.match(/.{2}/g)!.map((h: any) => parseInt(h, 16)))
    return Uint8Array.of(0x80 | lenBytes.length, ...lenBytes)
  }

  /**
   * Wrap one or more DER elements in a SEQUENCE:
   * 0x30 || totalLength || concatenatedElements
   */
  function encodeSequence(elements: any) {
    const content = elements.reduce((acc: any, elm: any) => Uint8Array.from([...acc, ...elm]), new Uint8Array())
    const len = encodeLength(content.length)
    return Uint8Array.from([0x30, ...len, ...content])
  }

  /**
   * Convert a Base64-URL string into a Uint8Array (handles padding & “-_/”).
   */
  function base64UrlToBytes(b64url: string): Uint8Array {
    return fromString(b64url, 'base64url')
  }

  jwk = sanitizedJwk(jwk)
  if (!jwk.n || !jwk.e) {
    throw new Error("RSA JWK must contain 'n' and 'e' properties.")
  }
  const modulusBytes = base64UrlToBytes(jwk.n)
  const exponentBytes = base64UrlToBytes(jwk.e)
  const sequence = encodeSequence([encodeInteger(modulusBytes), encodeInteger(exponentBytes)])
  const result = toString(sequence, 'hex')
  return result
  /*
    // We are converting from base64 to base64url to be sure. The spec uses base64url, but in the wild we sometimes encounter a base64 string
    const modulus = fromString(jwk.n.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), 'base64url') // 'n' is the modulus
    const exponent = fromString(jwk.e.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), 'base64url') // 'e' is the exponent
  
    return toString(modulus, 'hex') + toString(exponent, 'hex')*/
}

/**
 * Convert an EC JWK to a raw hex key.
 * @param jwk - The EC JWK object.
 * @returns A string representing the EC key in raw hexadecimal format.
 */
function ecJwkToRawHexKey(jwk: JsonWebKey): string {
  jwk = sanitizedJwk(jwk)
  if (!jwk.x || !jwk.y) {
    throw new Error("EC JWK must contain 'x' and 'y' properties.")
  }

  // We are converting from base64 to base64url to be sure. The spec uses base64url, but in the wild we sometimes encounter a base64 string
  const x = fromString(jwk.x.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), 'base64url')
  const y = fromString(jwk.y.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), 'base64url')

  return '04' + toString(x, 'hex') + toString(y, 'hex')
}

/**
 * Convert an EC JWK to a raw hex key.
 * @param jwk - The EC JWK object.
 * @returns A string representing the EC key in raw hexadecimal format.
 */
function okpJwkToRawHexKey(jwk: JsonWebKey): string {
  jwk = sanitizedJwk(jwk)
  if (!jwk.x) {
    throw new Error("OKP JWK must contain 'x' property.")
  }

  // We are converting from base64 to base64url to be sure. The spec uses base64url, but in the wild we sometimes encounter a base64 string
  const x = fromString(jwk.x.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), 'base64url')

  return toString(x, 'hex')
}

/**
 * Convert an octet JWK to a raw hex key.
 * @param jwk - The octet JWK object.
 * @returns A string representing the octet key in raw hexadecimal format.
 */
function octJwkToRawHexKey(jwk: JsonWebKey): string {
  jwk = sanitizedJwk(jwk)
  if (!jwk.k) {
    throw new Error("Octet JWK must contain 'k' property.")
  }

  // We are converting from base64 to base64url to be sure. The spec uses base64url, but in the wild we sometimes encounter a base64 string
  const key = fromString(jwk.k.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), 'base64url')

  return toString(key, 'hex')
}

/**
 * Determines the use param based upon the key/signature type or supplied use value.
 *
 * @param type The key type
 * @param suppliedUse A supplied use. Will be used in case it is present
 */
export const jwkDetermineUse = (type: TKeyType, suppliedUse?: JwkKeyUse): JwkKeyUse | undefined => {
  return suppliedUse
    ? suppliedUse
    : SIG_KEY_ALGS.includes(type)
    ? JwkKeyUse.Signature
    : ENC_KEY_ALGS.includes(type)
    ? JwkKeyUse.Encryption
    : undefined
}

/**
 * Assert the key has a proper length
 *
 * @param keyHex Input key
 * @param expectedKeyLength Expected key length(s)
 */
const assertProperKeyLength = (keyHex: string, expectedKeyLength: number | number[]) => {
  if (Array.isArray(expectedKeyLength)) {
    if (!expectedKeyLength.includes(keyHex.length)) {
      throw Error(
        `Invalid key length. Needs to be a hex string with length from ${JSON.stringify(expectedKeyLength)} instead of ${
          keyHex.length
        }. Input: ${keyHex}`
      )
    }
  } else if (keyHex.length !== expectedKeyLength) {
    throw Error(`Invalid key length. Needs to be a hex string with length ${expectedKeyLength} instead of ${keyHex.length}. Input: ${keyHex}`)
  }
}

/**
 * Generates a JWK from a Secp256k1 public key
 * @param keyHex Secp256k1 public or private key in hex
 * @param use The use for the key
 * @return The JWK
 */
const toSecp256k1Jwk = (keyHex: string, opts?: { use?: JwkKeyUse; isPrivateKey?: boolean }): JWK => {
  const { use } = opts ?? {}
  logger.debug(`toSecp256k1Jwk keyHex: ${keyHex}, length: ${keyHex.length}`)
  if (opts?.isPrivateKey) {
    assertProperKeyLength(keyHex, [64])
  } else {
    assertProperKeyLength(keyHex, [66, 130])
  }

  const secp256k1 = new elliptic.ec('secp256k1')
  const keyBytes = fromString(keyHex, 'base16')
  const keyPair = opts?.isPrivateKey ? secp256k1.keyFromPrivate(keyBytes) : secp256k1.keyFromPublic(keyBytes)
  const pubPoint = keyPair.getPublic()

  return sanitizedJwk({
    alg: JoseSignatureAlgorithm.ES256K,
    ...(use !== undefined && { use }),
    kty: JwkKeyType.EC,
    crv: JoseCurve.secp256k1,
    x: hexToBase64(pubPoint.getX().toString('hex'), 'base64url'),
    y: hexToBase64(pubPoint.getY().toString('hex'), 'base64url'),
    ...(opts?.isPrivateKey && { d: hexToBase64(keyPair.getPrivate('hex'), 'base64url') }),
  })
}

/**
 * Generates a JWK from a Secp256r1 public key
 * @param keyHex Secp256r1 public key in hex
 * @param use The use for the key
 * @return The JWK
 */
const toSecp256r1Jwk = (keyHex: string, opts?: { use?: JwkKeyUse; isPrivateKey?: boolean }): JWK => {
  const { use } = opts ?? {}
  logger.debug(`toSecp256r1Jwk keyHex: ${keyHex}, length: ${keyHex.length}`)
  if (opts?.isPrivateKey) {
    assertProperKeyLength(keyHex, [64])
  } else {
    assertProperKeyLength(keyHex, [66, 130])
  }

  const secp256r1 = new elliptic.ec('p256')
  const keyBytes = fromString(keyHex, 'base16')
  logger.debug(`keyBytes length: ${keyBytes}`)
  const keyPair = opts?.isPrivateKey ? secp256r1.keyFromPrivate(keyBytes) : secp256r1.keyFromPublic(keyBytes)
  const pubPoint = keyPair.getPublic()
  return sanitizedJwk({
    alg: JoseSignatureAlgorithm.ES256,
    ...(use !== undefined && { use }),
    kty: JwkKeyType.EC,
    crv: JoseCurve.P_256,
    x: hexToBase64(pubPoint.getX().toString('hex'), 'base64url'),
    y: hexToBase64(pubPoint.getY().toString('hex'), 'base64url'),
    ...(opts?.isPrivateKey && { d: hexToBase64(keyPair.getPrivate('hex'), 'base64url') }),
  })
}

/**
 * Generates a JWK from an Ed25519/X25519 public key
 * @param publicKeyHex Ed25519/X25519 public key in hex
 * @param opts
 * @return The JWK
 */
const toEd25519OrX25519Jwk = (
  publicKeyHex: string,
  opts: {
    use?: JwkKeyUse
    crv: JoseCurve.Ed25519 | JoseCurve.X25519
  }
): JWK => {
  assertProperKeyLength(publicKeyHex, 64)
  const { use } = opts ?? {}
  return sanitizedJwk({
    alg: JoseSignatureAlgorithm.EdDSA,
    ...(use !== undefined && { use }),
    kty: JwkKeyType.OKP,
    crv: opts?.crv ?? JoseCurve.Ed25519,
    x: hexToBase64(publicKeyHex, 'base64url'),
  })
}

const toRSAJwk = (publicKeyHex: string, opts?: { use?: JwkKeyUse; key?: IKey | MinimalImportableKey }): JWK => {
  function parseDerIntegers(pubKeyHex: string): { modulus: string; exponent: string } {
    const bytes = Buffer.from(pubKeyHex, 'hex')
    let offset = 0

    // 1) Outer SEQUENCE
    if (bytes[offset++] !== 0x30) throw new Error('Not a SEQUENCE')
    let len = bytes[offset++]
    if (len & 0x80) {
      const nBytes = len & 0x7f
      len = 0
      for (let i = 0; i < nBytes; i++) {
        len = (len << 8) + bytes[offset++]
      }
    }

    // 2) Look at next tag: INTEGER(0x02) means raw PKCS#1,
    //    otherwise assume X.509/SPKI wrapper.
    if (bytes[offset] !== 0x02) {
      // --- skip AlgorithmIdentifier SEQUENCE ---
      if (bytes[offset++] !== 0x30) throw new Error('Expected alg-ID SEQUENCE')
      let algLen = bytes[offset++]
      if (algLen & 0x80) {
        const nB = algLen & 0x7f
        algLen = 0
        for (let i = 0; i < nB; i++) algLen = (algLen << 8) + bytes[offset++]
      }
      offset += algLen

      // --- skip BIT STRING wrapper ---
      if (bytes[offset++] !== 0x03) throw new Error('Expected BIT STRING')
      let bitLen = bytes[offset++]
      if (bitLen & 0x80) {
        const nB = bitLen & 0x7f
        bitLen = 0
        for (let i = 0; i < nB; i++) bitLen = (bitLen << 8) + bytes[offset++]
      }
      // skip the “unused bits” byte
      offset += 1

      // now the next byte should be 0x30 for the inner SEQUENCE
      if (bytes[offset++] !== 0x30) throw new Error('Expected inner SEQUENCE')
      let innerLen = bytes[offset++]
      if (innerLen & 0x80) {
        const nB = innerLen & 0x7f
        innerLen = 0
        for (let i = 0; i < nB; i++) innerLen = (innerLen << 8) + bytes[offset++]
      }
    }

    // 3) Parse modulus INTEGER
    if (bytes[offset++] !== 0x02) throw new Error('Expected INTEGER for modulus')
    let modLen = bytes[offset++]
    if (modLen & 0x80) {
      const nB = modLen & 0x7f
      modLen = 0
      for (let i = 0; i < nB; i++) modLen = (modLen << 8) + bytes[offset++]
    }
    let modulusBytes = bytes.slice(offset, offset + modLen)
    offset += modLen

    // strip leading zero if present (unsigned integer in JWK)
    if (modulusBytes[0] === 0x00) {
      modulusBytes = modulusBytes.slice(1)
    }

    // 4) Parse exponent INTEGER
    if (bytes[offset++] !== 0x02) throw new Error('Expected INTEGER for exponent')
    let expLen = bytes[offset++]
    if (expLen & 0x80) {
      const nB = expLen & 0x7f
      expLen = 0
      for (let i = 0; i < nB; i++) expLen = (expLen << 8) + bytes[offset++]
    }
    const exponentBytes = bytes.slice(offset, offset + expLen)

    return {
      modulus: modulusBytes.toString('hex'),
      exponent: exponentBytes.toString('hex'),
    }
  }

  const meta = opts?.key?.meta
  if (meta?.publicKeyJwk || meta?.publicKeyPEM) {
    if (meta?.publicKeyJwk) {
      return meta.publicKeyJwk as JWK
    }
    const publicKeyPEM = meta?.publicKeyPEM ?? hexToPEM(publicKeyHex, 'public')
    const jwk = PEMToJwk(publicKeyPEM, 'public') as JWK
    return jwk
  }

  const { modulus, exponent } = parseDerIntegers(publicKeyHex)
  const sanitized = sanitizedJwk({
    kty: 'RSA',
    n: hexToBase64(modulus, 'base64url'),
    e: hexToBase64(exponent, 'base64url'),
  })
  return sanitized
}

export const padLeft = (args: { data: string; size?: number; padString?: string }): string => {
  const { data } = args
  const size = args.size ?? 32
  const padString = args.padString ?? '0'
  if (data.length >= size) {
    return data
  }

  if (padString && padString.length === 0) {
    throw Error(`Pad string needs to have at least a length of 1`)
  }
  const length = padString.length
  return padString.repeat((size - data.length) / length) + data
}

enum OIDType {
  Secp256k1,
  Secp256r1,
  Ed25519,
}

const OID: Record<OIDType, Uint8Array> = {
  [OIDType.Secp256k1]: new Uint8Array([0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01]),
  [OIDType.Secp256r1]: new Uint8Array([0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07]),
  [OIDType.Ed25519]: new Uint8Array([0x06, 0x03, 0x2b, 0x65, 0x70]),
}

const compareUint8Arrays = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) {
    return false
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false
    }
  }
  return true
}

const findSubarray = (haystack: Uint8Array, needle: Uint8Array): number => {
  for (let i = 0; i <= haystack.length - needle.length; i++) {
    if (compareUint8Arrays(haystack.subarray(i, i + needle.length), needle)) {
      return i
    }
  }
  return -1
}

const getTargetOID = (keyType: TKeyType) => {
  switch (keyType) {
    case 'Secp256k1':
      return OID[OIDType.Secp256k1]
    case 'Secp256r1':
      return OID[OIDType.Secp256r1]
    case 'Ed25519':
      return OID[OIDType.Ed25519]
    default:
      throw new Error(`Unsupported key type: ${keyType}`)
  }
}

export const isAsn1Der = (key: Uint8Array): boolean => key[0] === 0x30

export const asn1DerToRawPublicKey = (derKey: Uint8Array, keyType: TKeyType): Uint8Array => {
  if (!isAsn1Der(derKey)) {
    throw new Error('Invalid DER encoding: Expected to start with sequence tag')
  }

  let index = 2
  if (derKey[1] & 0x80) {
    const lengthBytesCount = derKey[1] & 0x7f
    index += lengthBytesCount
  }
  const targetOid = getTargetOID(keyType)
  const oidIndex = findSubarray(derKey, targetOid)
  if (oidIndex === -1) {
    throw new Error(`OID for ${keyType} not found in DER encoding`)
  }

  index = oidIndex + targetOid.length

  while (index < derKey.length && derKey[index] !== 0x03) {
    index++
  }

  if (index >= derKey.length) {
    throw new Error('Invalid DER encoding: Bit string not found')
  }

  // Skip the bit string tag (0x03) and length byte
  index += 2

  // Skip the unused bits count byte
  index++

  return derKey.slice(index)
}

export const isRawCompressedPublicKey = (key: Uint8Array): boolean => key.length === 33 && (key[0] === 0x02 || key[0] === 0x03)

export const toRawCompressedHexPublicKey = (rawPublicKey: Uint8Array, keyType: TKeyType): string => {
  if (isRawCompressedPublicKey(rawPublicKey)) {
    return hexStringFromUint8Array(rawPublicKey)
  }

  if (keyType === 'Secp256k1' || keyType === 'Secp256r1') {
    if (rawPublicKey[0] === 0x04 && rawPublicKey.length === 65) {
      const xCoordinate = rawPublicKey.slice(1, 33)
      const yCoordinate = rawPublicKey.slice(33)
      const prefix = new Uint8Array([yCoordinate[31] % 2 === 0 ? 0x02 : 0x03])
      const resultKey = hexStringFromUint8Array(new Uint8Array([...prefix, ...xCoordinate]))
      logger.debug(`converted public key ${hexStringFromUint8Array(rawPublicKey)} to ${resultKey}`)
      return resultKey
    }
    return toString(rawPublicKey, 'base16')
  } else if (keyType === 'Ed25519') {
    // Ed25519 keys are always in compressed form
    return toString(rawPublicKey, 'base16')
  }

  throw new Error(`Unsupported key type: ${keyType}`)
}

export const hexStringFromUint8Array = (value: Uint8Array): string => toString(value, 'base16')

export const signatureAlgorithmFromKey = async (args: SignatureAlgorithmFromKeyArgs): Promise<JoseSignatureAlgorithm> => {
  const { key } = args
  return signatureAlgorithmFromKeyType({ type: key.type })
}

export const signatureAlgorithmFromKeyType = (args: SignatureAlgorithmFromKeyTypeArgs): JoseSignatureAlgorithm => {
  const { type } = args
  switch (type) {
    case 'Ed25519':
    case 'X25519':
      return JoseSignatureAlgorithm.EdDSA
    case 'Secp256r1':
      return JoseSignatureAlgorithm.ES256
    case 'Secp384r1':
      return JoseSignatureAlgorithm.ES384
    case 'Secp521r1':
      return JoseSignatureAlgorithm.ES512
    case 'Secp256k1':
      return JoseSignatureAlgorithm.ES256K
    case 'RSA':
      return JoseSignatureAlgorithm.PS256
    default:
      throw new Error(`Key type '${type}' not supported`)
  }
}

// TODO improve this conversion for jwt and jsonld, not a fan of current structure
export const keyTypeFromCryptographicSuite = (args: KeyTypeFromCryptographicSuiteArgs): TKeyType => {
  const { crv, kty, alg } = args

  switch (alg) {
    case 'RSASSA-PSS':
    case 'RS256':
    case 'RS384':
    case 'RS512':
    case 'PS256':
    case 'PS384':
    case 'PS512':
      return 'RSA'
  }

  switch (crv) {
    case 'EdDSA':
    case 'Ed25519':
    case 'Ed25519Signature2018':
    case 'Ed25519Signature2020':
    case 'JcsEd25519Signature2020':
      return 'Ed25519'
    case 'JsonWebSignature2020':
    case 'ES256':
    case 'ECDSA':
    case 'P-256':
      return 'Secp256r1'
    case 'ES384':
    case 'P-384':
      return 'Secp384r1'
    case 'ES512':
    case 'P-521':
      return 'Secp521r1'
    case 'EcdsaSecp256k1Signature2019':
    case 'secp256k1':
    case 'ES256K':
    case 'EcdsaSecp256k1VerificationKey2019':
    case 'EcdsaSecp256k1RecoveryMethod2020':
      return 'Secp256k1'
  }
  if (kty) {
    return kty as TKeyType
  }

  throw new Error(`Cryptographic suite '${crv}' not supported`)
}

export function removeNulls<T>(obj: T | any) {
  Object.keys(obj).forEach((key) => {
    if (obj[key] && typeof obj[key] === 'object') removeNulls(obj[key])
    else if (obj[key] == null) delete obj[key]
  })
  return obj
}

export const globalCrypto = (setGlobal: boolean, suppliedCrypto?: Crypto): Crypto => {
  let webcrypto: Crypto
  if (typeof suppliedCrypto !== 'undefined') {
    webcrypto = suppliedCrypto
  } else if (typeof crypto !== 'undefined') {
    webcrypto = crypto
  } else if (typeof global.crypto !== 'undefined') {
    webcrypto = global.crypto
  } else {
    // @ts-ignore
    if (typeof global.window?.crypto?.subtle !== 'undefined') {
      // @ts-ignore
      webcrypto = global.window.crypto
    } else {
      webcrypto = import('crypto') as Crypto
    }
  }
  if (setGlobal) {
    global.crypto = webcrypto
  }

  return webcrypto
}

export const sanitizedJwk = (input: JWK | JsonWebKey): JWK => {
  const inputJwk = typeof input['toJsonDTO'] === 'function' ? input['toJsonDTO']() : ({ ...input } as JWK) // KMP code can expose this. It converts a KMP JWK with mangled names into a clean JWK

  const jwk = {
    ...inputJwk,
    ...(inputJwk.x && { x: base64ToBase64Url(inputJwk.x as string) }),
    ...(inputJwk.y && { y: base64ToBase64Url(inputJwk.y as string) }),
    ...(inputJwk.d && { d: base64ToBase64Url(inputJwk.d as string) }),
    ...(inputJwk.n && { n: base64ToBase64Url(inputJwk.n as string) }),
    ...(inputJwk.e && { e: base64ToBase64Url(inputJwk.e as string) }),
    ...(inputJwk.k && { k: base64ToBase64Url(inputJwk.k as string) }),
  } as JWK

  return removeNulls(jwk)
}

const base64ToBase64Url = (input: string): string => {
  return input.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 *
 */
export async function verifyRawSignature({
  data,
  signature,
  key: inputKey,
  opts,
}: {
  data: Uint8Array
  signature: Uint8Array
  key: JWK
  opts?: {
    signatureAlg?: JoseSignatureAlgorithm
  }
}) {
  /**
   * Converts a Base64URL-encoded JWK property to a BigInt.
   * @param jwkProp - The Base64URL-encoded string.
   * @returns The BigInt representation of the decoded value.
   */
  function jwkPropertyToBigInt(jwkProp: string): bigint {
    // Decode Base64URL to Uint8Array
    const byteArray = fromString(jwkProp, 'base64url')

    // Convert Uint8Array to hexadecimal string and then to BigInt
    const hex = toString(byteArray, 'hex')
    return BigInt(`0x${hex}`)
  }

  try {
    debug(`verifyRawSignature for: ${inputKey}`)
    const jwk = sanitizedJwk(inputKey)
    validateJwk(jwk, { crvOptional: true })
    const keyType = keyTypeFromCryptographicSuite({ crv: jwk.crv, kty: jwk.kty, alg: jwk.alg })
    const publicKeyHex = await jwkToRawHexKey(jwk)

    // TODO: We really should look at the signature alg first if provided! From key type should be the last resort
    switch (keyType) {
      case 'Secp256k1':
        return secp256k1.verify(signature, data, publicKeyHex, { format: 'compact', prehash: true })
      case 'Secp256r1':
        return p256.verify(signature, data, publicKeyHex, { format: 'compact', prehash: true })
      case 'Secp384r1':
        return p384.verify(signature, data, publicKeyHex, { format: 'compact', prehash: true })
      case 'Secp521r1':
        return p521.verify(signature, data, publicKeyHex, { format: 'compact', prehash: true })
      case 'Ed25519':
        return ed25519.verify(signature, data, fromString(publicKeyHex, 'hex'))
      case 'Bls12381G1':
      case 'Bls12381G2':
        return bls12_381.verify(signature, data, fromString(publicKeyHex, 'hex'))
      case 'RSA': {
        const signatureAlgorithm = opts?.signatureAlg ?? (jwk.alg as JoseSignatureAlgorithm | undefined) ?? JoseSignatureAlgorithm.PS256
        const hashAlg =
          signatureAlgorithm === (JoseSignatureAlgorithm.RS512 || JoseSignatureAlgorithm.PS512)
            ? sha512
            : signatureAlgorithm === (JoseSignatureAlgorithm.RS384 || JoseSignatureAlgorithm.PS384)
            ? sha384
            : sha256
        switch (signatureAlgorithm) {
          case JoseSignatureAlgorithm.RS256:
            return rsa.PKCS1_SHA256.verify(
              {
                n: jwkPropertyToBigInt(jwk.n!),
                e: jwkPropertyToBigInt(jwk.e!),
              },
              data,
              signature
            )
          case JoseSignatureAlgorithm.RS384:
            return rsa.PKCS1_SHA384.verify(
              {
                n: jwkPropertyToBigInt(jwk.n!),
                e: jwkPropertyToBigInt(jwk.e!),
              },
              data,
              signature
            )
          case JoseSignatureAlgorithm.RS512:
            return rsa.PKCS1_SHA512.verify(
              {
                n: jwkPropertyToBigInt(jwk.n!),
                e: jwkPropertyToBigInt(jwk.e!),
              },
              data,
              signature
            )
          case JoseSignatureAlgorithm.PS256:
          case JoseSignatureAlgorithm.PS384:
          case JoseSignatureAlgorithm.PS512:
            if (typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined') {
              const key = await cryptoSubtleImportRSAKey(jwk, 'RSA-PSS')
              const saltLength =
                signatureAlgorithm === JoseSignatureAlgorithm.PS256 ? 32 : signatureAlgorithm === JoseSignatureAlgorithm.PS384 ? 48 : 64
              return crypto.subtle.verify({ name: 'rsa-pss', hash: hashAlg, saltLength }, key, signature, data)
            }

            // FIXME
            console.warn(`Using fallback for RSA-PSS verify signature, which is known to be flaky!!`)
            return rsa.PSS(hashAlg, rsa.mgf1(hashAlg)).verify(
              {
                n: jwkPropertyToBigInt(jwk.n!),
                e: jwkPropertyToBigInt(jwk.e!),
              },
              data,
              signature
            )
        }
      }
    }

    throw Error(`Unsupported key type for signature validation: ${keyType}`)
  } catch (error: any) {
    logger.error(`Error: ${error}`)
    throw error
  }
}

/**
 * Minimal DER parser to unwrap X.509/SPKI‐wrapped RSA keys
 * into raw PKCS#1 RSAPublicKey format, using only Uint8Array.
 */

/**
 * Read a DER length at the given offset.
 * @param bytes – full DER buffer
 * @param offset – index of the length byte
 * @returns the parsed length, and how many bytes were used to encode it
 */
function readLength(bytes: Uint8Array, offset: number): { length: number; lengthBytes: number } {
  const first = bytes[offset]
  if (first < 0x80) {
    return { length: first, lengthBytes: 1 }
  }
  const numBytes = first & 0x7f
  let length = 0
  for (let i = 0; i < numBytes; i++) {
    length = (length << 8) | bytes[offset + 1 + i]
  }
  return { length, lengthBytes: 1 + numBytes }
}

/**
 * Ensure the given DER‐encoded RSA public key (Uint8Array)
 * is raw PKCS#1. If it's X.509/SPKI‐wrapped, we strip the wrapper.
 *
 * @param derBytes – DER‐encoded public key, either PKCS#1 or X.509/SPKI
 * @returns DER‐encoded PKCS#1 RSAPublicKey
 */
export function toPkcs1(derBytes: Uint8Array): Uint8Array {
  if (derBytes[0] !== 0x30) {
    throw new Error('Invalid DER: expected SEQUENCE')
  }

  // Parse outer SEQUENCE length
  const { lengthBytes: outerLenBytes } = readLength(derBytes, 1)
  const outerHeaderLen = 1 + outerLenBytes
  const innerTag = derBytes[outerHeaderLen]

  // If next tag is INTEGER (0x02), it's already raw PKCS#1
  if (innerTag === 0x02) {
    return derBytes
  }

  // Otherwise expect X.509/SPKI: SEQUENCE { algId, BIT STRING }
  if (innerTag !== 0x30) {
    throw new Error('Unexpected DER tag, not PKCS#1 or SPKI')
  }

  // Skip the algId SEQUENCE
  const { length: algLen, lengthBytes: algLenBytes } = readLength(derBytes, outerHeaderLen + 1)
  const algHeaderLen = 1 + algLenBytes
  const algIdEnd = outerHeaderLen + algHeaderLen + algLen

  // Next tag should be BIT STRING (0x03)
  if (derBytes[algIdEnd] !== 0x03) {
    throw new Error('Expected BIT STRING after algId')
  }

  const { length: bitStrLen, lengthBytes: bitStrLenBytes } = readLength(derBytes, algIdEnd + 1)
  const bitStrHeaderLen = 1 + bitStrLenBytes
  const bitStrStart = algIdEnd + bitStrHeaderLen

  // First byte of the BIT STRING is the "unused bits" count; usually 0x00
  const unusedBits = derBytes[bitStrStart]
  if (unusedBits !== 0x00) {
    throw new Error(`Unexpected unused bits: ${unusedBits}`)
  }

  // The rest is the PKCS#1 DER
  const pkcs1Start = bitStrStart + 1
  const pkcs1Len = bitStrLen - 1

  return derBytes.slice(pkcs1Start, pkcs1Start + pkcs1Len)
}

/**
 * Ensure the given DER‐encoded RSA public key in Hex
 * is raw PKCS#1. If it's X.509/SPKI‐wrapped, we strip the wrapper.
 *
 * @param derBytes – DER‐encoded public key, either PKCS#1 or X.509/SPKI
 * @returns DER‐encoded PKCS#1 RSAPublicKey in hex
 */
export function toPkcs1FromHex(publicKeyHex: string) {
  const pkcs1 = toPkcs1(fromString(publicKeyHex, 'hex'))
  return toString(pkcs1, 'hex')
}
