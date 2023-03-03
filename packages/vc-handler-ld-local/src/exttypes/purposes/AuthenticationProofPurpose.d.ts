export = AuthenticationProofPurpose

export interface IDcAuthenticationProofPurpose extends IDcControllerProofPurpose {
  challenge: string
  domain?: string
}

declare class AuthenticationProofPurpose extends ControllerProofPurpose {
  constructor({ term, controller, challenge, date, domain, maxTimestampDelta }: IDcAuthenticationProofPurpose = {} as IDcAuthenticationProofPurpose)
  challenge: string
  domain: any
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
    error: any
  }>
  update(
    proof: any,
    {
      document,
      suite,
      documentLoader,
      expansionMap,
    }: {
      document: any
      suite: any
      documentLoader: any
      expansionMap: any
    }
  ): Promise<any>
}
import ControllerProofPurpose = require('./ControllerProofPurpose')
import IDcControllerProofPurpose from './ControllerProofPurpose'
