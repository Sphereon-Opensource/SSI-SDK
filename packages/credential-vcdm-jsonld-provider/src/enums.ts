import sigpkg from '@digitalcredentials/jsonld-signatures'

export const ProofPurpose = sigpkg.purposes.ProofPurpose
export const ControllerProofPurpose = sigpkg.purposes.ControllerProofPurpose
export const AssertionProofPurpose = sigpkg.purposes.AssertionProofPurpose
export const AuthenticationProofPurpose = sigpkg.purposes.AuthenticationProofPurpose

/**
 * Plugin method map interface
 * @public
 */
export enum MethodNames {
  createVerifiableCredential = 'createVerifiableCredential',
  createVerifiablePresentation = 'createVerifiablePresentation',
  verifyCredential = 'verifyCredential',
  verifyPresentation = 'verifyPresentation',
}

export type IBindingOverrides = Map<string, MethodNames>

export enum events {
  CREDENTIAL_ISSUED = 'credentialIssued',
  CREDENTIAL_VERIFIED = 'credentialVerified',
  PRESENTATION_VERIFIED = 'presentationVerified',
  PRESENTATION_VERIFY_FAILED = 'presentationVerificationFailed',
  CREDENTIAL_VERIFY_FAILED = 'credentialVerificationFailed',
}
