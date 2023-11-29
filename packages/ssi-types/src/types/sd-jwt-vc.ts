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
    // TODO: add other cnf properties
  }
  status?: {
    idx: number
    uri: string
  }
  sub?: string

  [key: string]: JsonValue | undefined
}

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

/**
 * The presentation of an SD-JWT. It is the same as an SD-JWT credential, with the addition
 * of an optional key binding JWT that can be included.
 */
export interface SdJwtDecodedVerifiablePresentation extends SdJwtDecodedVerifiableCredential {
  /**
   * Compact JWT encoding of the key binding (kb) JSON Web Token. This property will be included
   * when the SD-JWT presentation includes a key binding JWT.
   */
  compactKbJwt?: string
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
