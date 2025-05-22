export enum JwkKeyType {
  EC = 'EC',
  RSA = 'RSA',
  oct = 'oct',
  OKP = 'OKP',
}

export enum JoseSignatureAlgorithm {
  RS256 = 'RS256',
  RS384 = 'RS384',
  RS512 = 'RS512',
  ES256 = 'ES256',
  ES256K = 'ES256K',
  ES384 = 'ES384',
  ES512 = 'ES512',
  EdDSA = 'EdDSA',
  HS256 = 'HS256',
  HS384 = 'HS384',
  HS512 = 'HS512',
  PS256 = 'PS256',
  PS384 = 'PS384',
  PS512 = 'PS512',
  none = 'none',
}

export enum JoseKeyOperation {
  SIGN = 'sign',
  VERIFY = 'verify',
  ENCRYPT = 'encrypt',
  DECRYPT = 'decrypt',
  WRAP_KEY = 'wrapKey',
  UNWRAP_KEY = 'unwrapKey',
  DERIVE_KEY = 'deriveKey',
  DERIVE_BITS = 'deriveBits',
}

export enum JoseCurve {
  P_256 = 'P-256',
  P_384 = 'P-384',
  P_521 = 'P-521',
  X25519 = 'X25519',
  X448 = 'X448',
  EdDSA = 'EdDSA',
  Ed25519 = 'Ed25519',
  Ed448 = 'Ed448',
  secp256k1 = 'secp256k1',
}
