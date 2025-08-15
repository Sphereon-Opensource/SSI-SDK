import type { ClientIdScheme } from '@sphereon/ssi-sdk-ext.x509-utils'
import type { ICoseKeyJson, JWK } from '@sphereon/ssi-types'
import type { DIDDocumentSection, IIdentifier, IKey, TKeyType } from '@veramo/core'
import {
  isCoseKeyIdentifier,
  isDidIdentifier,
  isOID4VCIssuerIdentifier,
  isJwkIdentifier,
  isKeyIdentifier,
  isKidIdentifier,
  isX5cIdentifier,
  type JwkInfo,
} from './common'

/**
 * Use whenever we need to pass in an identifier. We can pass in kids, DIDs, IIdentifier objects and x5chains
 *
 * The functions below can be used to check the type, and they also provide the proper 'runtime' types
 */
export type ManagedIdentifierType = IIdentifier /*did*/ | string /*did or kid*/ | string[] /*x5c*/ | JWK | IKey | ICoseKeyJson

export type ManagedIdentifierOpts = (
  | ManagedIdentifierJwkOpts
  | ManagedIdentifierX5cOpts
  | ManagedIdentifierDidOpts
  | ManagedIdentifierKidOpts
  | ManagedIdentifierKeyOpts
  | ManagedIdentifierCoseKeyOpts
  | ManagedIdentifierOID4VCIssuerOpts
) &
  ManagedIdentifierOptsBase

export type ManagedIdentifierOptsBase = {
  method?: ManagedIdentifierMethod // If provided always takes precedences otherwise it will be inferred from the identifier
  identifier: ManagedIdentifierType
  kmsKeyRef?: string // The key reference for the KMS system. If provided this value will be used to determine the appropriate key. Otherwise it will be inferred
  issuer?: string // can be used when a specific issuer needs to end up, for instance when signing JWTs. Will be returned or inferred if not provided
  kid?: string // can be used when a specific kid value needs to be used. For instance when signing JWTs. Will be returned or inferred if not provided
  clientId?: string
  clientIdScheme?: ClientIdScheme | 'did' | string
}

export type ManagedIdentifierDidOpts = Omit<ManagedIdentifierOptsBase, 'method' | 'identifier'> & {
  method?: 'did'
  identifier: IIdentifier | string
  keyType?: TKeyType
  offlineWhenNoDIDRegistered?: boolean
  noVerificationMethodFallback?: boolean
  controllerKey?: boolean
  vmRelationship?: DIDDocumentSection
}

export function isManagedIdentifierDidOpts(opts: ManagedIdentifierOptsBase): opts is ManagedIdentifierDidOpts {
  const { identifier } = opts
  return ('method' in opts && opts.method === 'did') || isDidIdentifier(identifier)
}

export type ManagedIdentifierKidOpts = Omit<ManagedIdentifierOptsBase, 'method' | 'identifier'> & {
  method?: 'kid'
  identifier: string
}

export function isManagedIdentifierKidOpts(opts: ManagedIdentifierOptsBase): opts is ManagedIdentifierKidOpts {
  const { identifier } = opts
  return ('method' in opts && opts.method === 'kid') || isKidIdentifier(identifier)
}

export type ManagedIdentifierKeyOpts = Omit<ManagedIdentifierOptsBase, 'method' | 'identifier'> & {
  method?: 'key'
  identifier: IKey
}

export function isManagedIdentifierKeyOpts(opts: ManagedIdentifierOptsBase): opts is ManagedIdentifierKeyOpts {
  const { identifier } = opts
  return ('method' in opts && opts.method === 'key') || isKeyIdentifier(identifier)
}

export type ManagedIdentifierCoseKeyOpts = Omit<ManagedIdentifierOptsBase, 'method' | 'identifier'> & {
  method?: 'cose_key'
  identifier: ICoseKeyJson
}

export function isManagedIdentifierCoseKeyOpts(opts: ManagedIdentifierOptsBase): opts is ManagedIdentifierCoseKeyOpts {
  const { identifier } = opts
  return ('method' in opts && opts.method === 'cose_key') || isCoseKeyIdentifier(identifier)
}

export type ManagedIdentifierOID4VCIssuerOpts = Omit<ManagedIdentifierOptsBase, 'method' | 'identifier'> & {
  method?: 'oid4vci-issuer'
  identifier: string
}

export function isManagedIdentifierOID4VCIssuerOpts(opts: ManagedIdentifierOptsBase): opts is ManagedIdentifierCoseKeyOpts {
  const { identifier } = opts
  return ('method' in opts && opts.method === 'oid4vci-issuer') || isOID4VCIssuerIdentifier(identifier)
}

export type ManagedIdentifierJwkOpts = Omit<ManagedIdentifierOptsBase, 'method' | 'identifier'> & {
  method?: 'jwk'
  identifier: JWK
}

export function isManagedIdentifierJwkOpts(opts: ManagedIdentifierOptsBase): opts is ManagedIdentifierJwkOpts {
  const { identifier } = opts
  return ('method' in opts && opts.method === 'jwk') || isJwkIdentifier(identifier)
}

export type ManagedIdentifierX5cOpts = Omit<ManagedIdentifierOptsBase, 'method' | 'identifier'> & {
  method?: 'x5c'
  identifier: string[]
}

export function isManagedIdentifierX5cOpts(opts: ManagedIdentifierOptsBase): opts is ManagedIdentifierX5cOpts {
  const { identifier } = opts
  return ('method' in opts && opts.method === 'x5c') || isX5cIdentifier(identifier)
}

export interface ManagedJwkInfo extends JwkInfo {
  kmsKeyRef: string
}

export interface IManagedIdentifierResultBase extends ManagedJwkInfo {
  method: ManagedIdentifierMethod
  opts: ManagedIdentifierOpts
  key: IKey
  kid?: string
  issuer?: string
  clientId?: string
  clientIdScheme?: ClientIdScheme | 'did' | string
  identifier: ManagedIdentifierType
}

export function isManagedIdentifierCoseKeyResult(object: IManagedIdentifierResultBase): object is ManagedIdentifierCoseKeyResult {
  return object!! && typeof object === 'object' && 'method' in object && object.method === 'cose_key'
}

export function isManagedIdentifierDidResult(object: IManagedIdentifierResultBase): object is ManagedIdentifierDidResult {
  return object!! && typeof object === 'object' && 'method' in object && object.method === 'did'
}

export function isManagedIdentifierX5cResult(object: IManagedIdentifierResultBase): object is ManagedIdentifierX5cResult {
  return object!! && typeof object === 'object' && 'method' in object && object.method === 'x5c'
}

export function isManagedIdentifierJwkResult(object: IManagedIdentifierResultBase): object is ManagedIdentifierJwkResult {
  return object!! && typeof object === 'object' && 'method' in object && object.method === 'jwk'
}

export function isManagedIdentifierKidResult(object: IManagedIdentifierResultBase): object is ManagedIdentifierKidResult {
  return object!! && typeof object === 'object' && 'method' in object && object.method === 'kid'
}

export function isManagedIdentifierKeyResult(object: IManagedIdentifierResultBase): object is ManagedIdentifierKeyResult {
  return object!! && typeof object === 'object' && 'method' in object && object.method === 'key'
}

export interface ManagedIdentifierDidResult extends IManagedIdentifierResultBase {
  method: 'did'
  identifier: IIdentifier
  did: string
  // key: IKey // The key associated with the requested did method sections. Controller key in case of no DID method section requested
  keys: Array<IKey> // If there is more than one key for the VM relationship.
  verificationMethodSection?: DIDDocumentSection
  controllerKeyId?: string
  issuer: string
  kid: string
}

export interface ManagedIdentifierJwkResult extends IManagedIdentifierResultBase {
  identifier: JWK
  method: 'jwk'
}

export interface ManagedIdentifierKidResult extends IManagedIdentifierResultBase {
  method: 'kid'
  identifier: string
  kid: string
}

export interface ManagedIdentifierKeyResult extends IManagedIdentifierResultBase {
  method: 'key'
  identifier: IKey
}

export interface ManagedIdentifierCoseKeyResult extends IManagedIdentifierResultBase {
  method: 'cose_key'
  identifier: ICoseKeyJson
}

export interface ManagedIdentifierOID4VCIssuerResult extends IManagedIdentifierResultBase {
  method: 'oid4vci-issuer'
  identifier: string
}

export interface ManagedIdentifierX5cResult extends IManagedIdentifierResultBase {
  method: 'x5c'
  identifier: string[]
  x5c: string[]
  certificate: any // Certificate(JSON_, but trips schema generator. Probably want to create our own DTO
}

export type ManagedIdentifierMethod = 'did' | 'jwk' | 'x5c' | 'kid' | 'key' | 'cose_key' | 'oid4vci-issuer'

export type ManagedIdentifierResult = IManagedIdentifierResultBase &
  (
    | ManagedIdentifierX5cResult
    | ManagedIdentifierDidResult
    | ManagedIdentifierJwkResult
    | ManagedIdentifierKidResult
    | ManagedIdentifierKeyResult
    | ManagedIdentifierCoseKeyResult
    | ManagedIdentifierOID4VCIssuerResult
  )

export type ManagedIdentifierOptsOrResult = (ManagedIdentifierResult | ManagedIdentifierOpts) & {
  lazyDisabled?: boolean
}
