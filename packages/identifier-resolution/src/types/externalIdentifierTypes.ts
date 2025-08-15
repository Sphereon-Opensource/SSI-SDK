import type { DidDocumentJwks } from '@sphereon/ssi-sdk-ext.did-utils'
import type { ICoseKeyJson, JWK } from '@sphereon/ssi-types'
import type { X509CertificateChainValidationOpts, X509ValidationResult } from '@sphereon/ssi-sdk-ext.x509-utils'
import type { IParsedDID } from '@sphereon/ssi-types'
import type { DIDDocument, DIDDocumentSection, DIDResolutionResult } from '@veramo/core'
import {
  isCoseKeyIdentifier,
  isDidIdentifier,
  isOIDFEntityIdIdentifier,
  isJwkIdentifier,
  isJwksUrlIdentifier,
  isKidIdentifier,
  isOidcDiscoveryIdentifier,
  isX5cIdentifier,
  type JwkInfo,
} from './common'
import type { JwsPayload } from './IJwtService'

/**
 * Use whenever we need to resolve an external identifier. We can pass in kids, DIDs, and x5chains
 *
 * The functions below can be used to check the type, and they also provide the proper runtime types
 */
export type ExternalIdentifierType = string | string[] | JWK

export type ExternalIdentifierOptsBase = {
  method?: ExternalIdentifierMethod // If provided always takes precedences otherwise it will be inferred from the identifier
  identifier: ExternalIdentifierType
}

export type ExternalIdentifierDidOpts = Omit<ExternalIdentifierOptsBase, 'method'> & {
  method?: 'did'
  identifier: string
  noVerificationMethodFallback?: boolean
  vmRelationship?: DIDDocumentSection
  localResolution?: boolean // Resolve identifiers hosted by the agent
  uniresolverResolution?: boolean // Resolve identifiers using universal resolver
  resolverResolution?: boolean // Use registered drivers
}

export function isExternalIdentifierDidOpts(opts: ExternalIdentifierOptsBase): opts is ExternalIdentifierDidOpts {
  const { identifier } = opts
  return ('method' in opts && opts.method === 'did') || isDidIdentifier(identifier)
}

export type ExternalIdentifierOpts = (
  | ExternalIdentifierJwkOpts
  | ExternalIdentifierX5cOpts
  | ExternalIdentifierDidOpts
  | ExternalIdentifierKidOpts
  | ExternalIdentifierCoseKeyOpts
  | ExternalIdentifierOIDFEntityIdOpts
) &
  ExternalIdentifierOptsBase

export type ExternalIdentifierKidOpts = Omit<ExternalIdentifierOptsBase, 'method'> & {
  method?: 'kid'
  identifier: string
}

export function isExternalIdentifierKidOpts(opts: ExternalIdentifierOptsBase): opts is ExternalIdentifierKidOpts {
  const { identifier } = opts
  return ('method' in opts && opts.method === 'kid') || isKidIdentifier(identifier)
}

export type ExternalIdentifierJwkOpts = Omit<ExternalIdentifierOptsBase, 'method'> & {
  method?: 'jwk'
  identifier: JWK
  x5c?: ExternalIdentifierX5cOpts
}

export function isExternalIdentifierJwkOpts(opts: ExternalIdentifierOptsBase): opts is ExternalIdentifierJwkOpts {
  const { identifier } = opts
  return ('method' in opts && opts.method === 'jwk') || isJwkIdentifier(identifier)
}

export type ExternalIdentifierCoseKeyOpts = Omit<ExternalIdentifierOptsBase, 'method'> & {
  method?: 'cose_key'
  identifier: ICoseKeyJson
}

export function isExternalIdentifierCoseKeyOpts(opts: ExternalIdentifierOptsBase): opts is ExternalIdentifierCoseKeyOpts {
  const { identifier } = opts
  return ('method' in opts && opts.method === 'cose_key') || isCoseKeyIdentifier(identifier)
}

export type ExternalIdentifierOidcDiscoveryOpts = Omit<ExternalIdentifierOptsBase, 'method'> & {
  method?: 'oidc-discovery'
  identifier: string
}

export function isExternalIdentifierOidcDiscoveryOpts(opts: ExternalIdentifierOptsBase): opts is ExternalIdentifierJwkOpts {
  const { identifier } = opts
  return ('method' in opts && opts.method === 'oidc-discovery') || isOidcDiscoveryIdentifier(identifier)
}

export type ExternalIdentifierJwksUrlOpts = Omit<ExternalIdentifierOptsBase, 'method'> & {
  method?: 'jwks-url'
  identifier: string
}

export function isExternalIdentifierJwksUrlOpts(opts: ExternalIdentifierOptsBase): opts is ExternalIdentifierJwksUrlOpts {
  const { identifier } = opts
  return ('method' in opts && opts.method === 'oidc-discovery') || isJwksUrlIdentifier(identifier)
}

export type ExternalIdentifierOIDFEntityIdOpts = Omit<ExternalIdentifierOptsBase, 'method'> & {
  method?: 'entity_id'
  identifier: string
  trustAnchors?: Array<string>
}

export function isExternalIdentifierOIDFEntityIdOpts(opts: ExternalIdentifierOptsBase): opts is ExternalIdentifierOIDFEntityIdOpts {
  const { identifier } = opts
  return (('method' in opts && opts.method === 'entity_id') || 'trustAnchors' in opts) && isOIDFEntityIdIdentifier(identifier)
}

export type ExternalIdentifierX5cOpts = Omit<ExternalIdentifierOptsBase, 'method'> &
  X509CertificateChainValidationOpts & {
    method?: 'x5c'
    identifier: string[]
    verify?: boolean // defaults to true
    verificationTime?: Date
    trustAnchors?: string[]
  }

export function isExternalIdentifierX5cOpts(opts: ExternalIdentifierOptsBase): opts is ExternalIdentifierX5cOpts {
  const { identifier } = opts
  return ('method' in opts && opts.method === 'x5c') || isX5cIdentifier(identifier)
}

export type ExternalIdentifierMethod = 'did' | 'jwk' | 'x5c' | 'kid' | 'cose_key' | 'oidc-discovery' | 'jwks-url' | 'oid4vci-issuer' | 'entity_id'

export type ExternalIdentifierResult = IExternalIdentifierResultBase &
  (
    | ExternalIdentifierDidResult
    | ExternalIdentifierX5cResult
    | ExternalIdentifierJwkResult
    | ExternalIdentifierOIDFEntityIdResult
    | ExternalIdentifierCoseKeyResult
  )

export interface IExternalIdentifierResultBase {
  method: ExternalIdentifierMethod
  jwks: Array<ExternalJwkInfo>
}

export interface ExternalIdentifierJwkResult extends IExternalIdentifierResultBase {
  method: 'jwk'
  jwk: JWK
  x5c?: ExternalIdentifierX5cResult
}

export interface ExternalIdentifierCoseKeyResult extends IExternalIdentifierResultBase {
  method: 'cose_key'
  coseKey: ICoseKeyJson
  x5c?: ExternalIdentifierX5cResult
}

export interface ExternalIdentifierX5cResult extends IExternalIdentifierResultBase {
  method: 'x5c'
  x5c: string[]
  issuerJWK: JWK
  verificationResult?: X509ValidationResult
  certificates: any[] // for now since our schema generator trips on pkijs Certificate(Json) object //fixme
}

export type TrustedAnchor = string
export type PublicKeyHex = string
export type ErrorMessage = string

export interface ExternalIdentifierOIDFEntityIdResult extends IExternalIdentifierResultBase {
  method: 'entity_id'
  trustedAnchors: Array<TrustedAnchor>
  errorList?: Record<TrustedAnchor, ErrorMessage>
  jwtPayload?: JwsPayload
  trustEstablished: boolean
}

export interface ExternalJwkInfo extends JwkInfo {
  kid?: string
  publicKeyHex: string
}

export interface ExternalIdentifierDidResult extends IExternalIdentifierResultBase {
  method: 'did'
  did: string
  didDocument?: DIDDocument
  didJwks?: DidDocumentJwks
  didResolutionResult: Omit<DIDResolutionResult, 'didDocument'> // we already provide that directly
  didParsed: IParsedDID
}
