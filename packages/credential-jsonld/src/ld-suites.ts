import type { CredentialPayload, IKey, PresentationPayload, TKeyType } from '@veramo/core'
// @ts-ignore
import type { DIDDocument } from 'did-resolver/lib/resolver'
import { IVcdmIssuerAgentContext, IVcdmVerifierAgentContext } from '@sphereon/ssi-sdk.credential-vcdm'
import { VerifiableCredentialSP } from '@sphereon/ssi-sdk.core'

// export type RequiredAgentMethods = IResolver & IDIDManager & Pick<ISphereonKeyManager, 'keyManagerGet' | 'keyManagerSign' | 'keyManagerVerify'>

export abstract class SphereonLdSignature {
  // LinkedDataSignature Suites according to
  // https://github.com/digitalbazaar/jsonld-signatures/blob/main/lib/suites/LinkedDataSignature
  // Add type definition as soon as https://github.com/digitalbazaar/jsonld-signatures
  // supports those.

  abstract getSupportedVerificationType(): string | string[]

  abstract getSupportedProofType(): string

  abstract getSupportedKeyType(): TKeyType

  abstract getSuiteForSigning(key: IKey, issuerDid: string, verificationMethodId: string, context: IVcdmIssuerAgentContext): any

  abstract getContext(): string

  abstract getSuiteForVerification(context: IVcdmVerifierAgentContext): any

  abstract preDidResolutionModification(didUrl: string, didDoc: DIDDocument): void

  abstract preSigningCredModification(credential: CredentialPayload): void

  abstract preVerificationCredModification(credential: VerifiableCredentialSP): void

  preSigningPresModification(presentation: PresentationPayload): void {
    // TODO: Remove invalid field 'verifiers' from Presentation. Needs to be adapted for LD verifiableCredentials
    // Only remove empty array (vc.signPresentation will throw then)
    const sanitizedPresentation = presentation as any
    if (sanitizedPresentation?.verifier?.length == 0) {
      delete sanitizedPresentation.verifier
    }
  }
}
