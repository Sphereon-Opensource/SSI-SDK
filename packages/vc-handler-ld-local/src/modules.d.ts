declare module 'ed25519-signature-2018-context'
declare module 'ed25519-signature-2020-context'
declare module '@digitalcredentials/vc'
declare module '@digitalcredentials/jsonld'
declare module '@digitalcredentials/ed25519-signature-2020'
declare module '@digitalcredentials/ed25519-verification-key-2020'
declare module '@digitalcredentials/did-method-key'
declare module '@mattrglobal/bbs-signatures'
declare module '@transmute/lds-ecdsa-secp256k1-recovery2020'

declare module '@digitalcredentials/jsonld-signatures' {
  export const purposes: {
    AssertionProofPurpose: {
      new ({
        term,
        controller,
        date,
        maxTimestampDelta,
      }?: {
        term?: string
        controller: any
        date: any
        maxTimestampDelta?: number
      }): import('./exttypes/purposes/AssertionProofPurpose')
    }
    AuthenticationProofPurpose: {
      new ({
        term,
        controller,
        challenge,
        date,
        domain,
        maxTimestampDelta,
      }?: {
        term?: string
        controller: any
        challenge: any
        date: any
        domain: any
        maxTimestampDelta?: number
      }): import('./exttypes/purposes/AuthenticationProofPurpose')
    }
    ControllerProofPurpose: {
      new ({ term, controller, date, maxTimestampDelta }?: string): import('./exttypes/purposes/ControllerProofPurpose')
    }
    ProofPurpose: {
      new ({ term, date, maxTimestampDelta }?: string): import('./exttypes/purposes/ProofPurpose')
    }

    CredentialIssuancePurpose: {
      new ({
        controller,
        date,
        maxTimestampDelta,
      }?: {
        term?: string
        controller: any
        date: any
        maxTimestampDelta?: number
      }): import('./exttypes/purposes/CredentialIssuancePurpose')
    }
  }

  export function extendContextLoader(documentLoader: any): (url: any) => Function
}
