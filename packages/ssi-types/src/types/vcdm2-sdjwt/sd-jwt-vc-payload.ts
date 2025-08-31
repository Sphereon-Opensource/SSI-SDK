import { type IVcdm2Credential } from '../w3c-vc'
import { type JWK } from '../jose'

export type SdJwtPayload = Record<string, unknown> //Record<string, SdJwtJsonValue>

/**
 * The payload MAY contain the _sd_alg key described in Section 4.1.1.
 * The payload MAY contain one or more digests of Disclosures to enable selective disclosure of the respective claims, created and formatted as described in Section 4.2.
 * The payload MAY contain one or more decoy digests to obscure the actual number of claims in the SD-JWT, created and formatted as described in Section 4.2.5.
 * The payload MAY contain one or more permanently disclosed claims.
 * The payload MAY contain the Holder's public key(s) or reference(s) thereto, as explained in Section 4.1.2.
 * The payload MAY contain further claims such as iss, iat, etc. as defined or required by the application using SD-JWTs.
 * The payload MUST NOT contain the claims _sd or ... except for the purpose of conveying digests as described in Section 4.2.4.1 and Section 4.2.4.2 respectively below.
 */
export interface SdJwtVcdm2Payload extends IVcdm2Credential, SdJwtPayload {
  _sd_alg?: string
  _sd?: string[]
  // OPTIONAL unless cryptographic Key Binding is to be supported, in which case it is REQUIRED. Contains the confirmation method identifying the proof of possession key as defined in [RFC7800]. It is RECOMMENDED that this contains a JWK as defined in Section 3.2 of [RFC7800]. For proof of cryptographic Key Binding, the Key Binding JWT in the presentation of the SD-JWT MUST be signed by the key identified in this claim.
  cnf?: {
    jwk?: JWK
    kid?: string
  }
}
