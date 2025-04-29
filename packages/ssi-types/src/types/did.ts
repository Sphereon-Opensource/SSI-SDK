

export interface IParsedDID {
  did: string
  didUrl: string
  method: string
  id: string
  path?: string
  fragment?: string
  query?: string
  params?: {
    [index: string]: string
  }
}


/**
 * Defines an object type that can be extended with other properties.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Extensible = Record<string, any>

/**
 * Defines the result of a DID resolution operation.
 *
 * @see {@link Resolvable.resolve}
 * @see {@link https://www.w3.org/TR/did-core/#did-resolution}
 */
export interface DIDResolutionResult {
  '@context'?: 'https://w3id.org/did-resolution/v1' | string | string[]
  didResolutionMetadata: DIDResolutionMetadata
  didDocument: DIDDocument | null
  didDocumentMetadata: DIDDocumentMetadata
}

/**
 * Describes the options forwarded to the resolver when executing a {@link Resolvable.resolve} operation.
 *
 * @see {@link https://www.w3.org/TR/did-core/#did-resolution-options}
 */
export interface DIDResolutionOptions extends Extensible {
  accept?: string
}

/**
 * Encapsulates the resolution metadata resulting from a {@link Resolvable.resolve} operation.
 *
 * @see {@link https://www.w3.org/TR/did-core/#did-resolution-metadata}
 */
export interface DIDResolutionMetadata extends Extensible {
  contentType?: string
  error?: 'invalidDid' | 'notFound' | 'representationNotSupported' | 'unsupportedDidMethod' | string
}

/**
 * Represents metadata about the DID document resulting from a {@link Resolvable.resolve} operation.
 *
 * @see {@link https://www.w3.org/TR/did-core/#did-document-metadata}
 */
export interface DIDDocumentMetadata extends Extensible {
  created?: string
  updated?: string
  deactivated?: boolean
  versionId?: string
  nextUpdate?: string
  nextVersionId?: string
  equivalentId?: string
  canonicalId?: string
}

/**
 * Represents the Verification Relationship between a DID subject and a Verification Method.
 *
 * @see {@link https://www.w3.org/TR/did-core/#verification-relationships}
 */
export type KeyCapabilitySection = 'authentication' | 'assertionMethod' | 'keyAgreement' | 'capabilityInvocation' | 'capabilityDelegation'

/**
 * Represents a DID document.
 *
 * @see {@link https://www.w3.org/TR/did-core/#did-document-properties}
 */
export type DIDDocument = {
  '@context'?: 'https://www.w3.org/ns/did/v1' | string | string[]
  id: string
  alsoKnownAs?: string[]
  controller?: string | string[]
  verificationMethod?: VerificationMethod[]
  service?: Service[]
  /**
   * @deprecated
   */
  publicKey?: VerificationMethod[]
} & {
  [x in KeyCapabilitySection]?: (string | VerificationMethod)[]
}

/**
 * Represents a Service entry in a {@link https://www.w3.org/TR/did-core/#did-document-properties | DID document}.
 *
 * @see {@link https://www.w3.org/TR/did-core/#services}
 * @see {@link https://www.w3.org/TR/did-core/#service-properties}
 */
export interface Service {
  id: string
  type: string
  serviceEndpoint: ServiceEndpoint | ServiceEndpoint[]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any
}

/**
 * Represents an endpoint of a Service entry in a DID document.
 *
 * @see {@link https://www.w3.org/TR/did-core/#dfn-serviceendpoint}
 * @see {@link https://www.w3.org/TR/did-core/#services}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ServiceEndpoint = string | Record<string, any>

/**
 * Encapsulates a JSON web key type that includes only the public properties that
 * can be used in DID documents.
 *
 * The private properties are intentionally omitted to discourage the use
 * (and accidental disclosure) of private keys in DID documents.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc7517 | RFC7517 JsonWebKey (JWK)}
 */
export interface JsonWebKey extends Extensible {
  alg?: string
  crv?: string
  e?: string
  ext?: boolean
  key_ops?: string[]
  kid?: string
  kty: string
  n?: string
  use?: string
  x?: string
  y?: string
}

/**
 * Represents the properties of a Verification Method listed in a DID document.
 *
 * This data type includes public key representations that are no longer present in the spec but are still used by
 * several DID methods / resolvers and kept for backward compatibility.
 *
 * @see {@link https://www.w3.org/TR/did-core/#verification-methods}
 * @see {@link https://www.w3.org/TR/did-core/#verification-method-properties}
 */
export interface VerificationMethod {
  id: string
  type: string
  controller: string
  publicKeyBase58?: string
  publicKeyBase64?: string
  publicKeyJwk?: JsonWebKey
  publicKeyHex?: string
  publicKeyMultibase?: string
  blockchainAccountId?: string
  ethereumAddress?: string

  // ConditionalProof2022 subtypes
  conditionOr?: VerificationMethod[]
  conditionAnd?: VerificationMethod[]
  threshold?: number
  conditionThreshold?: VerificationMethod[]
  conditionWeightedThreshold?: ConditionWeightedThreshold[]
  conditionDelegated?: string
  relationshipParent?: string[]
  relationshipChild?: string[]
  relationshipSibling?: string[]
}

export interface ConditionWeightedThreshold {
  condition: VerificationMethod
  weight: number
}
