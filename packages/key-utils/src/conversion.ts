import {
  ICoseCurve,
  type ICoseKeyJson,
  ICoseKeyOperation,
  ICoseKeyType,
  ICoseSignatureAlgorithm,
  JoseCurve,
  type JoseCurveString,
  JoseKeyOperation,
  type JoseKeyOperationString,
  JoseSignatureAlgorithm,
  type JoseSignatureAlgorithmString,
  type JWK,
  JwkKeyType,
  type JwkKeyTypeString,
} from '@sphereon/ssi-types'
import { removeNulls } from './functions'

export function coseKeyToJwk(coseKey: ICoseKeyJson): JWK {
  const { x5chain, key_ops, crv, alg, baseIV, kty, ...rest } = coseKey
  return removeNulls({
    ...rest,
    kty: coseToJoseKty(kty),
    ...(crv && { crv: coseToJoseCurve(crv) }),
    ...(key_ops && { key_ops: key_ops.map(coseToJoseKeyOperation) }),
    ...(alg && { alg: coseToJoseSignatureAlg(alg) }),
    ...(baseIV && { iv: baseIV }),
    ...(x5chain && { x5c: x5chain }),
  }) satisfies JWK
}

export function jwkToCoseKey(jwk: JWK): ICoseKeyJson {
  const { x5c, key_ops, crv, alg, iv, kty, ...rest } = jwk

  return removeNulls({
    ...rest,
    kty: joseToCoseKty(kty),
    ...(crv && { crv: joseToCoseCurve(crv) }),
    ...(key_ops && { key_ops: key_ops.map(joseToCoseKeyOperation) }),
    ...(alg && { alg: joseToCoseSignatureAlg(alg) }),
    ...(iv && { baseIV: iv }),
    ...(x5c && { x5chain: x5c }),
    // @ts-ignore
  } satisfies ICoseKeyJson)
}

export function coseToJoseKty(kty: ICoseKeyType): JwkKeyType {
  switch (kty) {
    case ICoseKeyType.EC2:
      return JwkKeyType.EC
    case ICoseKeyType.RSA:
      return JwkKeyType.RSA
    case ICoseKeyType.Symmetric:
      return JwkKeyType.oct
    case ICoseKeyType.OKP:
      return JwkKeyType.OKP
    default:
      throw Error(`Key type ${kty} not supported in JWA`)
  }
}

export function joseToCoseKty(kty: JwkKeyType | JwkKeyTypeString): ICoseKeyType {
  switch (kty) {
    case 'EC':
      return ICoseKeyType.EC2
    case 'RSA':
      return ICoseKeyType.RSA
    case 'oct':
      return ICoseKeyType.Symmetric
    case 'OKP':
      return ICoseKeyType.OKP
    default:
      throw Error(`Key type ${kty} not supported in Cose`)
  }
}

export function coseToJoseSignatureAlg(coseAlg: ICoseSignatureAlgorithm): JoseSignatureAlgorithm {
  switch (coseAlg) {
    case ICoseSignatureAlgorithm.ES256K:
      return JoseSignatureAlgorithm.ES256K
    case ICoseSignatureAlgorithm.ES256:
      return JoseSignatureAlgorithm.ES256
    case ICoseSignatureAlgorithm.ES384:
      return JoseSignatureAlgorithm.ES384
    case ICoseSignatureAlgorithm.ES512:
      return JoseSignatureAlgorithm.ES512
    case ICoseSignatureAlgorithm.PS256:
      return JoseSignatureAlgorithm.PS256
    case ICoseSignatureAlgorithm.PS384:
      return JoseSignatureAlgorithm.PS384
    case ICoseSignatureAlgorithm.PS512:
      return JoseSignatureAlgorithm.PS512
    case ICoseSignatureAlgorithm.HS256:
      return JoseSignatureAlgorithm.HS256
    case ICoseSignatureAlgorithm.HS384:
      return JoseSignatureAlgorithm.HS384
    case ICoseSignatureAlgorithm.HS512:
      return JoseSignatureAlgorithm.HS512
    case ICoseSignatureAlgorithm.EdDSA:
      return JoseSignatureAlgorithm.EdDSA
    default:
      throw Error(`Signature algorithm ${coseAlg} not supported in Jose`)
  }
}

export function joseToCoseSignatureAlg(joseAlg: JoseSignatureAlgorithm | JoseSignatureAlgorithmString): ICoseSignatureAlgorithm {
  switch (joseAlg) {
    case (JoseSignatureAlgorithm.ES256K, 'ES256K'):
      return ICoseSignatureAlgorithm.ES256K
    case (JoseSignatureAlgorithm.ES256, 'ES256'):
      return ICoseSignatureAlgorithm.ES256
    case (JoseSignatureAlgorithm.ES384, 'ES384'):
      return ICoseSignatureAlgorithm.ES384
    case (JoseSignatureAlgorithm.ES512, 'ES512'):
      return ICoseSignatureAlgorithm.ES512
    case (JoseSignatureAlgorithm.PS256, 'PS256'):
      return ICoseSignatureAlgorithm.PS256
    case (JoseSignatureAlgorithm.PS384, 'PS384'):
      return ICoseSignatureAlgorithm.PS384
    case (JoseSignatureAlgorithm.PS512, 'PS512'):
      return ICoseSignatureAlgorithm.PS512
    case (JoseSignatureAlgorithm.HS256, 'HS256'):
      return ICoseSignatureAlgorithm.HS256
    case (JoseSignatureAlgorithm.HS384, 'HS384'):
      return ICoseSignatureAlgorithm.HS384
    case (JoseSignatureAlgorithm.HS512, 'HS512'):
      return ICoseSignatureAlgorithm.HS512
    case (JoseSignatureAlgorithm.EdDSA, 'EdDSA'):
      return ICoseSignatureAlgorithm.EdDSA
    default:
      throw Error(`Signature algorithm ${joseAlg} not supported in Cose`)
  }
}

export function joseToCoseKeyOperation(keyOp: JoseKeyOperation | JoseKeyOperationString): ICoseKeyOperation {
  switch (keyOp) {
    case (JoseKeyOperation.SIGN, 'sign'):
      return ICoseKeyOperation.SIGN
    case (JoseKeyOperation.VERIFY, 'verify'):
      return ICoseKeyOperation.VERIFY
    case (JoseKeyOperation.ENCRYPT, 'encrypt'):
      return ICoseKeyOperation.ENCRYPT
    case (JoseKeyOperation.DECRYPT, 'decrypt'):
      return ICoseKeyOperation.DECRYPT
    case (JoseKeyOperation.WRAP_KEY, 'wrapKey'):
      return ICoseKeyOperation.WRAP_KEY
    case (JoseKeyOperation.UNWRAP_KEY, 'unwrapKey'):
      return ICoseKeyOperation.UNWRAP_KEY
    case (JoseKeyOperation.DERIVE_KEY, 'deriveKey'):
      return ICoseKeyOperation.DERIVE_KEY
    case (JoseKeyOperation.DERIVE_BITS, 'deriveBits'):
      return ICoseKeyOperation.DERIVE_BITS
    default:
      throw Error(`Key operation ${keyOp} not supported in Cose`)
  }
}

export function coseToJoseKeyOperation(keyOp: ICoseKeyOperation): JoseKeyOperation {
  switch (keyOp) {
    case ICoseKeyOperation.SIGN:
      return JoseKeyOperation.SIGN
    case ICoseKeyOperation.VERIFY:
      return JoseKeyOperation.VERIFY
    case ICoseKeyOperation.ENCRYPT:
      return JoseKeyOperation.ENCRYPT
    case ICoseKeyOperation.DECRYPT:
      return JoseKeyOperation.DECRYPT
    case ICoseKeyOperation.WRAP_KEY:
      return JoseKeyOperation.WRAP_KEY
    case ICoseKeyOperation.UNWRAP_KEY:
      return JoseKeyOperation.UNWRAP_KEY
    case ICoseKeyOperation.DERIVE_KEY:
      return JoseKeyOperation.DERIVE_KEY
    case ICoseKeyOperation.DERIVE_BITS:
      return JoseKeyOperation.DERIVE_BITS
    default:
      throw Error(`Key operation ${keyOp} not supported in Jose`)
  }
}

export function joseToCoseCurve(curve: JoseCurve | JoseCurveString): ICoseCurve {
  switch (curve) {
    case (JoseCurve.P_256, 'P-256'):
      return ICoseCurve.P_256
    case (JoseCurve.P_384, 'P-384'):
      return ICoseCurve.P_384
    case (JoseCurve.P_521, 'P-521'):
      return ICoseCurve.P_521
    case (JoseCurve.X25519, 'X25519'):
      return ICoseCurve.X25519
    case (JoseCurve.X448, 'X448'):
      return ICoseCurve.X448
    case (JoseCurve.Ed25519, 'Ed25519'):
      return ICoseCurve.Ed25519
    case (JoseCurve.Ed448, 'Ed448'):
      return ICoseCurve.Ed448
    case (JoseCurve.secp256k1, 'secp256k1'):
      return ICoseCurve.secp256k1
    default:
      throw Error(`Curve ${curve} not supported in Cose`)
  }
}

export function coseToJoseCurve(curve: ICoseCurve): JoseCurve {
  switch (curve) {
    case ICoseCurve.P_256:
      return JoseCurve.P_256
    case ICoseCurve.P_384:
      return JoseCurve.P_384
    case ICoseCurve.P_521:
      return JoseCurve.P_521
    case ICoseCurve.X25519:
      return JoseCurve.X25519
    case ICoseCurve.X448:
      return JoseCurve.X448
    case ICoseCurve.Ed25519:
      return JoseCurve.Ed25519
    case ICoseCurve.Ed448:
      return JoseCurve.Ed448
    case ICoseCurve.secp256k1:
      return JoseCurve.secp256k1
    default:
      throw Error(`Curve ${curve} not supported in Jose`)
  }
}
