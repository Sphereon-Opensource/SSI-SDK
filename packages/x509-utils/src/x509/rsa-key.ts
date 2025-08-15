// @ts-ignore
import { KeyUsage, CryptoKey, RsaHashedImportParams, RsaHashedKeyGenParams } from 'node'

// @ts-ignore
import * as u8a from 'uint8arrays'
const { toString } = u8a
import type { HashAlgorithm } from '../types'
import { globalCrypto } from './crypto'

import { derToPEM } from './x509-utils'
import type { JsonWebKey } from '@sphereon/ssi-types'

export type RSASignatureSchemes = 'RSASSA-PKCS1-V1_5' | 'RSA-PSS'

export type RSAEncryptionSchemes = 'RSAES-PKCS-v1_5 ' | 'RSAES-OAEP'

const usage = (jwk: JsonWebKey): KeyUsage[] => {
  if (jwk.key_ops && jwk.key_ops.length > 0) {
    return jwk.key_ops as KeyUsage[]
  }
  if (jwk.use) {
    const usages: KeyUsage[] = []
    if (jwk.use.includes('sig')) {
      usages.push('sign', 'verify')
    } else if (jwk.use.includes('enc')) {
      usages.push('encrypt', 'decrypt')
    }
    if (usages.length > 0) {
      return usages
    }
  }
  if (jwk.kty === 'RSA') {
    if (jwk.d) {
      return jwk.alg?.toUpperCase()?.includes('QAEP') ? ['encrypt'] : ['sign']
    }
    return jwk.alg?.toUpperCase()?.includes('QAEP') ? ['decrypt'] : ['verify']
  }
  // "decrypt" | "deriveBits" | "deriveKey" | "encrypt" | "sign" | "unwrapKey" | "verify" | "wrapKey";
  return jwk.d && jwk.kty !== 'RSA' ? ['sign', 'decrypt', 'verify', 'encrypt'] : ['verify']
}

export const signAlgorithmToSchemeAndHashAlg = (signingAlg: string) => {
  const alg = signingAlg.toUpperCase()
  let scheme: RSAEncryptionSchemes | RSASignatureSchemes
  if (alg.startsWith('RS')) {
    scheme = 'RSASSA-PKCS1-V1_5'
  } else if (alg.startsWith('PS')) {
    scheme = 'RSA-PSS'
  } else {
    throw Error(`Invalid signing algorithm supplied ${signingAlg}`)
  }

  const hashAlgorithm = `SHA-${alg.substring(2)}` as HashAlgorithm
  return { scheme, hashAlgorithm }
}

export const cryptoSubtleImportRSAKey = async (
  jwk: JsonWebKey,
  scheme: RSAEncryptionSchemes | RSASignatureSchemes,
  hashAlgorithm?: HashAlgorithm
): Promise<CryptoKey> => {
  const hashName = hashAlgorithm ? hashAlgorithm : jwk.alg ? `SHA-${jwk.alg.substring(2)}` : 'SHA-256'

  const importParams: RsaHashedImportParams = { name: scheme, hash: hashName }
  return await globalCrypto(false).subtle.importKey('jwk', jwk as JsonWebKey, importParams, false, usage(jwk))
}

export const generateRSAKeyAsPEM = async (
  scheme: RSAEncryptionSchemes | RSASignatureSchemes,
  hashAlgorithm?: HashAlgorithm,
  modulusLength?: number
): Promise<string> => {
  const hashName = hashAlgorithm ? hashAlgorithm : 'SHA-256'

  const params: RsaHashedKeyGenParams = {
    name: scheme,
    hash: hashName,
    modulusLength: modulusLength ? modulusLength : 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
  }
  const keyUsage: KeyUsage[] = scheme === 'RSA-PSS' || scheme === 'RSASSA-PKCS1-V1_5' ? ['sign', 'verify'] : ['encrypt', 'decrypt']

  const keypair = await globalCrypto(false).subtle.generateKey(params, true, keyUsage)
  const pkcs8 = await globalCrypto(false).subtle.exportKey('pkcs8', keypair.privateKey)

  const uint8Array = new Uint8Array(pkcs8)
  return derToPEM(toString(uint8Array, 'base64pad'), 'RSA PRIVATE KEY')
}
