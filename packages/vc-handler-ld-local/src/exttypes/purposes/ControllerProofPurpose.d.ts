import IDcProofPurpose from './ProofPurpose'

export = ControllerProofPurpose

export interface IDcControllerProofPurpose extends IDcProofPurpose {
  controller: object
}

declare class ControllerProofPurpose extends ProofPurpose {
  constructor({ term, controller, date, maxTimestampDelta }: IDcControllerProofPurpose = {} as IDcControllerProofPurpose)

  controller: object

  _termDefinedByDIDContext: boolean
  /**
   * Validates the purpose of a proof. This method is called during
   * proof verification, after the proof value has been checked against the
   * given verification method (e.g. in the case of a digital signature, the
   * signature has been cryptographically verified against the public key).
   *
   * @param proof
   * @param verificationMethod
   * @param documentLoader
   * @param expansionMap
   *
   * @throws {Error} If verification method not authorized by controller
   * @throws {Error} If proof's created timestamp is out of range
   *
   * @returns {Promise<{valid: boolean, error: Error}>}
   */
  validate(
    proof: any,
    {
      verificationMethod,
      documentLoader,
      expansionMap,
    }: {
      verificationMethod: any
      documentLoader: any
      expansionMap: any
    }
  ): Promise<{
    valid: boolean
    error: Error
  }>
}
import ProofPurpose = require('./ProofPurpose')
