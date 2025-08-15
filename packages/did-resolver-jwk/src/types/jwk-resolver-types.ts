export enum Key {
  Ed25519 = 'Ed25519',
  Secp256k1 = 'Secp256k1',
  Secp256r1 = 'Secp256r1',
}

export enum KeyUse {
  Encryption = 'enc',
  Signature = 'sig',
}

export enum KeyType {
  EC = 'EC',
  OKP = 'OKP',
}

export enum VerificationType {
  JsonWebKey2020 = 'JsonWebKey2020',
}
export const SIG_KEY_ALGS = ['ES256', 'ES384', 'ES512', 'EdDSA', 'ES256K', 'Ed25519', 'Secp256k1', 'Secp256r1', 'Bls12381G1', 'Bls12381G2']
export const ENC_KEY_ALGS = ['X25519', 'ECDH_ES_A256KW', 'RSA_OAEP_256']

// https://datatracker.ietf.org/doc/html/rfc8812#section-3
// https://datatracker.ietf.org/doc/html/rfc8812#section-4
export enum VocabType {
  Jose = 'https://www.iana.org/assignments/jose#',
}

export enum ContextType {
  DidDocument = 'https://www.w3.org/ns/did/v1',
}
