/**
 * Conversion functions to Cose available for TS in our @sphereon/ssi-sdk-ext.key-utils package
 */
import { JoseCurve, JoseKeyOperation, JoseSignatureAlgorithm, JwkKeyType } from '../utils'

export interface BaseJWK {
  kty: JwkKeyType | JwkKeyTypeString
  crv?: JoseCurve | JoseCurveString
  alg?: JoseSignatureAlgorithm | JoseSignatureAlgorithmString
  x?: string
  y?: string
  e?: string
  n?: string
}

export type JoseSignatureAlgorithmString =
  | 'RS256'
  | 'RS384'
  | 'RS512'
  | 'ES256'
  | 'ES256K'
  | 'ES384'
  | 'ES512'
  | 'EdDSA'
  | 'HS256'
  | 'HS384'
  | 'HS512'
  | 'PS256'
  | 'PS384'
  | 'PS512'
  | 'none'

export interface JWK extends BaseJWK {
  d?: string
  dp?: string
  dq?: string
  ext?: boolean
  k?: string
  key_ops?: (JoseKeyOperation | JoseKeyOperationString)[]
  kid?: string
  oth?: Array<{
    d?: string
    r?: string
    t?: string
  }>
  p?: string
  q?: string
  qi?: string
  use?: string
  /** JWK "x5c" (X.509 Certificate Chain) Parameter. */
  x5c?: string[]
  /** JWK "x5t" (X.509 Certificate SHA-1 Thumbprint) Parameter. */
  x5t?: string
  /** "x5t#S256" (X.509 Certificate SHA-256 Thumbprint) Parameter. */
  'x5t#S256'?: string
  /** JWK "x5u" (X.509 URL) Parameter. */
  x5u?: string

  iv?: string

  [propName: string]: unknown
}

export type JwkKeyTypeString = 'EC' | 'RSA' | 'oct' | 'OKP'

export type JoseKeyOperationString = 'sign' | 'verify' | 'encrypt' | 'decrypt' | 'wrapKey' | 'unwrapKey' | 'deriveKey' | 'deriveBits'

export type JoseCurveString = 'P-256' | 'P-384' | 'P-521' | 'X25519' | 'X448' | 'EdDSA' | 'Ed25519' | 'Ed448' | 'secp256k1'
