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
  export function extendContextLoader(documentLoader: any): (url: any) => Function
}
