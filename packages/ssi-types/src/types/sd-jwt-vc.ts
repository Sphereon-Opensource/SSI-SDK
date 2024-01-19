import { OriginalType, WrappedVerifiableCredential, WrappedVerifiablePresentation } from './vc'
import { decodeSdJwtVc as _decodeSdJwtVc } from '@sd-jwt/decode'

type JsonValue = string | number | boolean | { [x: string]: JsonValue | undefined } | Array<JsonValue>

type SdJwtJsonValue =
  | string
  | number
  | boolean
  | {
      [x: string]: SdJwtJsonValue | undefined
      _sd?: string[]
    }
  | Array<SdJwtJsonValue | { '...': string }>

/**
 * Decoded 'pretty' SD JWT Verifiable Credential. This representation has all the `_sd` properties
 * removed, and includes the disclosures directly within the payload.
 */
export interface SdJwtDecodedVerifiableCredentialPayload {
  vct: string
  iss: string
  iat: number
  nbf?: number
  exp?: number
  cnf?: {
    jwk?: any
    kid?: string
  }
  status?: {
    idx: number
    uri: string
  }
  sub?: string

  [key: string]: JsonValue | undefined
}

/**
 * Represents a selective disclosure JWT vc in compact form.
 */
export type CompactSdJwtVc = string

/**
 * The signed payload of an SD-JWT. Includes fields such as `_sd`, `...` and `_sd_alg`
 */
interface SdJwtSignedVerifiableCredentialPayload extends SdJwtDecodedVerifiableCredentialPayload {
  // Only present if there are any selectively discloseable claims
  _sd?: string[]
  _sd_alg?: string

  [x: string]: SdJwtJsonValue | undefined
}

type SdJwtFrameValue = boolean | Array<SdJwtFrameValue> | { [x: string]: SdJwtFrameValue }
export type SdJwtDisclosureFrame = Record<string, SdJwtFrameValue>
export type SdJwtPresentationFrame = Record<string, SdJwtFrameValue>

/**
 * Input for creating a SD JWT Verifiable Credential. This representation optionally includes the disclosure frame,
 * (as `__disclosureFrame`) to indicate which fields in the signed SD-JWT should be selectively discloseable
 */
export interface SdJwtCredentialInput extends SdJwtDecodedVerifiableCredentialPayload {
  /**
   * Disclosure frame, indicating which fields in the signed SD-JWT should be selectively discloseable
   * Will be removed from the actual SD-JWT payload before signing
   */
  __disclosureFrame?: SdJwtDisclosureFrame
}

export type SdJwtDecodedDisclosure = [string, string, JsonValue] | [string, JsonValue]
export interface SdJwtDisclosure {
  // The encoded disclosure
  encoded: string

  // The decoded disclosure, in format [salt, claim, value] or in case of array entry [salt, value]
  decoded: SdJwtDecodedDisclosure

  // Digest over disclosure, can be used to match against a value within the SD JWT payload
  digest: string
}

/**
 * The decoded SD JWT Verifiable Credential. This representation includes multiple representations of the
 * same SD-JWT, and allows to fully process an SD-JWT, as well as create a presentation SD-JWT  (minus the KB-JWT) by removing
 * certain disclosures from the compact SD-JWT.
 *
 * This representation is useful as it doesn't require a hasher implementation to match the different digests in the signed SD-JWT
 * payload, with the different disclosures.
 */
export interface SdJwtDecodedVerifiableCredential {
  /**
   * The compact sd jwt is the sd-jwt encoded as string. It is a normal JWT,
   * with the disclosures and kb-jwt appended separated by ~ */
  compactSdJwtVc: string

  /**
   * The disclosures included within the SD-JWT in both encoded and decoded format.
   * The digests are also included, and allows the disclosures to be linked against
   * the digests in the signed payload.
   */
  disclosures: Array<SdJwtDisclosure>

  /**
   * The signed payload is the payload of the sd-jwt that is actually signed, and that includes
   * the `_sd` and `...` digests.
   */
  signedPayload: SdJwtSignedVerifiableCredentialPayload

  /**
   * The decoded payload is the payload when all `_sd` and `...` digests have been replaced
   * by the actual values from the disclosures. This format could also be seen as the 'pretty`
   * version of the SD JWT payload.
   *
   * This is useful for displaying the contents of the SD JWT VC to the user, or for example
   * for querying the contents of the SD JWT VC using a PEX presentation definition path.
   */
  decodedPayload: SdJwtDecodedVerifiableCredentialPayload
}

export interface WrappedSdJwtVerifiableCredential {
  /**
   * Original VC that we've received. Can be either the encoded or decoded variant.
   */
  original: SdJwtDecodedVerifiableCredential | CompactSdJwtVc
  /**
   * Decoded version of the SD-JWT payload. This is the decoded payload, rather than the whole SD-JWT as the `decoded` property
   * is used in e.g. PEX to check for path filters from fields. The full decoded credential can be found in the `credential` field.
   */
  decoded: SdJwtDecodedVerifiableCredentialPayload
  /**
   * Type of this credential.
   */
  type: OriginalType.SD_JWT_VC_DECODED | OriginalType.SD_JWT_VC_ENCODED
  /**
   * The claim format, typically used during exchange transport protocols
   */
  format: 'vc+sd-jwt'
  /**
   * Internal stable representation of a Credential
   */
  credential: SdJwtDecodedVerifiableCredential
}

export interface WrappedSdJwtVerifiablePresentation {
  /**
   * Original VP that we've received. Can be either the encoded or decoded variant.
   */
  original: SdJwtDecodedVerifiableCredential | CompactSdJwtVc
  /**
   * Decoded version of the SD-JWT payload. This is the decoded payload, rather than the whole SD-JWT.
   */
  decoded: SdJwtDecodedVerifiableCredentialPayload
  /**
   * Type of this Presentation.
   */
  type: OriginalType.SD_JWT_VC_DECODED | OriginalType.SD_JWT_VC_ENCODED
  /**
   * The claim format, typically used during exchange transport protocols
   */
  format: 'vc+sd-jwt'
  /**
   * Internal stable representation of a Presentation
   */
  presentation: SdJwtDecodedVerifiableCredential
  /**
   * Wrapped Verifiable Credentials belonging to the Presentation. Will always be an array
   * with a single SdJwtVerifiableCredential entry.
   */
  vcs: [WrappedSdJwtVerifiableCredential]
}

export function isWrappedSdJwtVerifiableCredential(vc: WrappedVerifiableCredential): vc is WrappedSdJwtVerifiableCredential {
  return vc.format === 'vc+sd-jwt'
}

export function isWrappedSdJwtVerifiablePresentation(vp: WrappedVerifiablePresentation): vp is WrappedSdJwtVerifiablePresentation {
  return vp.format === 'vc+sd-jwt'
}

export type Hasher = (data: string, alg: string) => Uint8Array
export type AsyncHasher = (data: string, alg: string) => Promise<Uint8Array>

/**
 * Decode an SD-JWT vc from its compact format (string) to an object containing the disclosures,
 * signed payload, decoded payload and the compact SD-JWT vc.
 *
 * Both the input and output interfaces of this method are defined in `@sphereon/ssi-types`, so
 * this method hides the actual implementation of SD-JWT (which is currently based on @sd-jwt/core)
 */
export function decodeSdJwtVc(compactSdJwtVc: CompactSdJwtVc, hasher: Hasher): SdJwtDecodedVerifiableCredential {
  const { signedPayload, decodedPayload, disclosures } = _decodeSdJwtVc(compactSdJwtVc, hasher)

  return {
    compactSdJwtVc,
    decodedPayload: decodedPayload as SdJwtDecodedVerifiableCredentialPayload,
    disclosures: disclosures.map((d) => {
      const decoded = d.key ? [d.salt, d.key, d.value] : [d.salt, d.value]
      return {
        decoded: decoded as SdJwtDecodedDisclosure,
        digest: d.digest,
        encoded: d.encoded,
      } satisfies SdJwtDisclosure
    }),
    signedPayload: signedPayload as SdJwtDecodedVerifiableCredentialPayload,
  }
}

/**
 * Decode an SD-JWT vc from its compact format (string) to an object containing the disclosures,
 * signed payload, decoded payload and the compact SD-JWT vc.
 *
 * Both the input and output interfaces of this method are defined in `@sphereon/ssi-types`, so
 * this method hides the actual implementation of SD-JWT (which is currently based on @sd-jwt/core)
 */
export async function decodeSdJwtVcAsync(compactSdJwtVc: CompactSdJwtVc, hasher: AsyncHasher): Promise<SdJwtDecodedVerifiableCredential> {
  const { signedPayload, decodedPayload, disclosures } = await _decodeSdJwtVc(compactSdJwtVc, hasher)

  return {
    compactSdJwtVc,
    decodedPayload: decodedPayload as SdJwtDecodedVerifiableCredentialPayload,
    disclosures: disclosures.map((d) => {
      const decoded = d.key ? [d.salt, d.key, d.value] : [d.salt, d.value]
      return {
        decoded: decoded as SdJwtDecodedDisclosure,
        digest: d.digest,
        encoded: d.encoded,
      } satisfies SdJwtDisclosure
    }),
    signedPayload: signedPayload as SdJwtDecodedVerifiableCredentialPayload,
  }
}
