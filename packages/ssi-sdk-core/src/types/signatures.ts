import { IProofPurpose, IProofType } from '@sphereon/ssi-types'

export interface ProofOptions {
  /**
   * The signature type. For instance RsaSignature2018
   */
  type?: IProofType | string

  /**
   * Type supports selective disclosure?
   */
  typeSupportsSelectiveDisclosure?: boolean

  /**
   * A challenge protecting against replay attacks
   */
  challenge?: string

  /**
   * A domain protecting against replay attacks
   */
  domain?: string

  /**
   * The purpose of this proof, for instance assertionMethod or authentication, see https://www.w3.org/TR/vc-data-model/#proofs-signatures-0
   */
  proofPurpose?: IProofPurpose | string

  /**
   * The ISO8601 date-time string for creation. You can update the Proof value later in the callback. If not supplied the current date/time will be used
   */
  created?: string

  /**
   * Similar to challenge. A nonce to protect against replay attacks, used in some ZKP proofs
   */
  nonce?: string
}
