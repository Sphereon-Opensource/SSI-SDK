export enum JwkKeyUse {
  Encryption = 'enc',
  Signature = 'sig',
}

export type HashAlgorithm = 'SHA-256' | 'SHA-512'

export type KeyVisibility = 'public' | 'private'

export interface X509Opts {
  cn?: string // The certificate Common Name. Will be used as the KID for the private key. Uses alias if not provided.
  privateKeyPEM?: string // Optional as you also need to provide it in hex format, but advisable to use it
  certificatePEM?: string // Optional, as long as the certificate then is part of the certificateChainPEM
  certificateChainURL?: string // Certificate chain URL. If used this is where the certificateChainPEM will be hosted/found.
  certificateChainPEM?: string // Base64 (not url!) encoded DER certificate chain. Please provide even if certificateChainURL is used!
}
