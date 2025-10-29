import mdocPkg from '@sphereon/kmp-mdoc-core'

import { ICoseCurve, ICoseKeyOperation, ICoseKeyType, ICoseSignatureAlgorithm } from '../utils'
type KeyType = mdocPkg.com.sphereon.crypto.generic.KeyType
type KeyOperations = mdocPkg.com.sphereon.crypto.generic.KeyOperations
type SignatureAlgorithm = mdocPkg.com.sphereon.crypto.generic.SignatureAlgorithm

/**
 * See our mdl-mdoc and crypto library for more information
 * https://github.com/Sphereon-Opensource/mdoc-cbor-crypto-multiplatform
 *
 * Conversion functions are available in above library.
 * Conversion functions are also available for TS in our @sphereon/ssi-sdk-ext.key-utils package
 *
 */
export interface ICoseKeyJson {
  kty: ICoseKeyType
  kid?: string
  alg?: ICoseSignatureAlgorithm
  key_ops?: Array<ICoseKeyOperation>
  baseIV?: string
  crv?: ICoseCurve
  x?: string
  y?: string
  d?: string
  x5chain?: Array<string>
  getSignatureAlgorithm(): SignatureAlgorithm
  getKty(): KeyType
  getKeyOperations(): Array<KeyOperations>
  getX509CertificateChain(): Array<string> | undefined
  toPublicKey(): ICoseKeyJson
  getKidAsString(): string | undefined
  getXAsString(): string
  getYAsString(): string

  [k: string]: unknown
}
