import { DIDResolutionOptions } from 'did-resolver'

export const DID_LD_JSON = 'application/did+ld+json'
export const DID_JSON = 'application/did+json'

export type PublicKeyFormat =
  | 'JsonWebKey2020'
  | 'Ed25519VerificationKey2018'
  | 'X25519KeyAgreementKey2019'
  | 'Ed25519VerificationKey2020'
  | 'X25519KeyAgreementKey2020'
  | 'Multikey'
export interface KeyToDidDocArgs {
  pubKeyBytes: Uint8Array
  fingerprint: string
  contentType?: string
  options?: DIDKeyResolutionOptions
}

export interface DIDKeyResolutionOptions extends DIDResolutionOptions {
  publicKeyFormat?: PublicKeyFormat
}
