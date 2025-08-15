import type {
  ExternalIdentifierDidOpts,
  ExternalIdentifierResult,
  ExternalIdentifierX5cOpts,
  IIdentifierResolution,
  ManagedIdentifierOptsOrResult,
  ManagedIdentifierResult,
} from '@sphereon/ssi-sdk-ext.identifier-resolution'
import type { ClientIdScheme } from '@sphereon/ssi-sdk-ext.x509-utils'
import type { BaseJWK, IValidationResult, JoseSignatureAlgorithm, JoseSignatureAlgorithmString, JWK } from '@sphereon/ssi-types'
import type { IAgentContext, IKeyManager, IPluginMethodMap } from '@veramo/core'

export type IRequiredContext = IAgentContext<IIdentifierResolution & IKeyManager> // could we still interop with Veramo?

export const jwtServiceContextMethods: Array<string> = [
  'jwtPrepareJws',
  'jwtCreateJwsJsonGeneralSignature',
  'jwtCreateJwsJsonFlattenedSignature',
  'jwtCreateJwsCompactSignature',
  'jwtVerifyJwsSignature',
  'jwtEncryptJweCompactJwt',
  'jwtDecryptJweCompactJwt',
]

export interface IJwtService extends IPluginMethodMap {
  jwtPrepareJws(args: CreateJwsJsonArgs, context: IRequiredContext): Promise<PreparedJwsObject>

  jwtCreateJwsJsonGeneralSignature(args: CreateJwsJsonArgs, context: IRequiredContext): Promise<JwsJsonGeneral>

  jwtCreateJwsJsonFlattenedSignature(args: CreateJwsFlattenedArgs, context: IRequiredContext): Promise<JwsJsonFlattened>

  jwtCreateJwsCompactSignature(args: CreateJwsCompactArgs, context: IRequiredContext): Promise<JwtCompactResult>

  jwtVerifyJwsSignature(args: VerifyJwsArgs, context: IRequiredContext): Promise<IJwsValidationResult>

  jwtEncryptJweCompactJwt(args: EncryptJweCompactJwtArgs, context: IRequiredContext): Promise<JwtCompactResult>

  jwtDecryptJweCompactJwt(args: DecryptJweCompactJwtArgs, context: IRequiredContext): Promise<JwtCompactResult>

  // TODO: JWE/encryption general methods
}

export type IJwsValidationResult = IValidationResult & {
  jws: JwsJsonGeneralWithIdentifiers // We always translate to general as that is the most flexible format allowing multiple sigs
}

export interface PreparedJws {
  protectedHeader: JwsHeader
  payload: Uint8Array
  unprotectedHeader?: JwsHeader // only for jws json and also then optional
  existingSignatures?: Array<JwsJsonSignature> // only for jws json and also then optional
}

export interface JwsJsonSignature {
  protected: string
  header?: JwsHeader
  signature: string
}

/**
 * The JWK representation of an ephemeral public key.
 * See https://www.rfc-editor.org/rfc/rfc7518.html#section-6
 */
// todo split into separate objects
export type EphemeralPublicKey = Omit<BaseJWK, 'alg'>

// export function isEcJWK(v)

export interface JweHeader extends Omit<BaseJwtHeader, 'alg'> {
  alg: string
  enc: string
  jku?: string
  jwk?: BaseJWK
  epk?: EphemeralPublicKey
  x5u?: string
  x5c?: string[]
  x5t?: string
  cty?: string
  crit?: string[]

  [k: string]: any
}

export interface JweRecipientUnprotectedHeader {
  alg: string
  iv: string
  tag: string
  epk?: EphemeralPublicKey
  kid?: string
  apv?: string
  apu?: string
}

export interface JweProtectedHeader extends Partial<JweHeader> {
  zip?: 'DEF' | string
}

export type Jws = JwsCompact | JwsJsonFlattened | JwsJsonGeneral

export type JwsCompact = string

export interface JwsJsonFlattened {
  payload: string
  protected: string
  header?: JwsHeader
  signature: string
}

export interface JwsJsonGeneral {
  payload: string
  signatures: Array<JwsJsonSignature>
}

export interface JwsJsonGeneralWithIdentifiers extends JwsJsonGeneral {
  signatures: Array<JwsJsonSignatureWithIdentifier>
}

export interface JwsJsonSignatureWithIdentifier extends JwsJsonSignature {
  identifier: ExternalIdentifierResult
}

export type Jwe = JweCompact | JweJsonFlattened | JweJsonGeneral
export type JweCompact = string

export interface JweJsonFlattened {
  protected: string
  unprotected: JweHeader
  header: JweHeader | JweRecipientUnprotectedHeader
  encrypted_key?: string
  aad?: string
  iv: string
  ciphertext: string
  tag?: string
}

export interface JweRecipient {
  header?: JweRecipientUnprotectedHeader
  encrypted_key?: string
}

export interface JweJsonGeneral {
  protected: string
  unprotected?: JweHeader
  recipients: Array<JweRecipient>
  aad?: string
  iv: string
  ciphertext: string
  tag?: string
}

export interface PreparedJwsObject {
  jws: PreparedJws
  b64: { payload: string; protectedHeader: string } // header is always json, as it can only be used in JwsJson
  identifier: ManagedIdentifierResult
}

export interface BaseJwtHeader {
  typ?: string
  alg?: string
  kid?: string
}

export interface BaseJwtPayload {
  iss?: string
  sub?: string
  aud?: string[] | string
  exp?: number
  nbf?: number
  iat?: number
  jti?: string
}

export interface JwsHeader extends BaseJwtHeader {
  kid?: string
  jwk?: JWK
  x5c?: string[]

  [key: string]: unknown
}

export interface JwsPayload extends BaseJwtPayload {
  [key: string]: unknown
}

export interface JwsHeaderOpts {
  alg: JoseSignatureAlgorithm | JoseSignatureAlgorithmString
}

export type JwsIdentifierMode = 'x5c' | 'kid' | 'jwk' | 'did' | 'auto'

export type EncryptJweCompactJwtArgs = {
  payload: JwsPayload
  protectedHeader?: JweProtectedHeader | undefined
  aad?: Uint8Array | undefined
  recipientKey: ExternalIdentifierResult & { kid?: string }
  alg?: JweAlg
  enc?: JweEnc
  apu?: string // base64url
  apv?: string // base64url
  expirationTime?: number | string | Date
  issuer?: string
  audience?: string | string[]
}

export type DecryptJweCompactJwtArgs = {
  jwe: JweCompact
  idOpts: ManagedIdentifierOptsOrResult
}

export type CreateJwsArgs = {
  mode?: JwsIdentifierMode
  issuer: ManagedIdentifierOptsOrResult & {
    noIssPayloadUpdate?: boolean
    noIdentifierInHeader?: boolean
  }
  clientId?: string
  clientIdScheme?: ClientIdScheme | 'did' | string
  protectedHeader: JwsHeader
  payload: JwsPayload | Uint8Array | string
}

export type CreateJweArgs = {
  mode?: JwsIdentifierMode
  issuer: ManagedIdentifierOptsOrResult & {
    noIssPayloadUpdate?: boolean
    noIdentifierInHeader?: boolean
  }
  protectedHeader: JweProtectedHeader
  encryptedKey: string | EphemeralPublicKey // In case it is a string it is already encrypted; otherwise encrypt //TODO ??
  iv: string
  ciphertext: string
  tag: string
}
export type CreateJwsCompactArgs = CreateJwsArgs

export type CreateJwsFlattenedArgs = Exclude<CreateJwsJsonArgs, 'existingSignatures'>

export type VerifyJwsArgs = {
  jws: Jws
  jwk?: JWK // Jwk will be resolved from jws, but you can also provide one
  opts?: { x5c?: Omit<ExternalIdentifierX5cOpts, 'identifier'>; did?: Omit<ExternalIdentifierDidOpts, 'identifier'> }
}

/**
 * @public
 */
export type CreateJwsJsonArgs = CreateJwsArgs & {
  unprotectedHeader?: JwsHeader // only for jws json
  existingSignatures?: Array<JwsJsonSignature> // Only for jws json
}

export type CreateJweJsonArgs = CreateJweArgs & {
  unprotectedHeader?: JweHeader
}

/**
 * @public
 */
export interface JwtCompactResult {
  jwt: JwsCompact | JweCompact
}

export function isJwsCompact(jws: Jws): jws is JwsCompact {
  return typeof jws === 'string' && jws.split('~')[0].match(COMPACT_JWS_REGEX) !== null
}

export function isJweCompact(jwe: Jwe): jwe is JweCompact {
  return typeof jwe === 'string' && jwe.split('~')[0].match(COMPACT_JWE_REGEX) !== null
}

export function isJwsJsonFlattened(jws: Jws): jws is JwsJsonFlattened {
  return typeof jws === 'object' && 'signature' in jws && 'protected' in jws && !('ciphertext' in jws)
}

export function isJwsJsonGeneral(jws: Jws): jws is JwsJsonGeneral {
  return typeof jws === 'object' && 'signatures' in jws && !('ciphertext' in jws)
}

export function isJweJsonFlattened(jwe: Jwe): jwe is JweJsonFlattened {
  return typeof jwe === 'object' && 'signature' in jwe && 'ciphertext' in jwe && !('payload' in jwe)
}

export function isJweJsonGeneral(jwe: Jwe): jwe is JweJsonGeneral {
  return typeof jwe === 'object' && 'signatures' in jwe && 'ciphertext' in jwe && !('payload' in jwe)
}

export function isJwsHeader(header: BaseJwtHeader & Record<string, any>): header is JwsHeader {
  return header && !isJweHeader(header)
}

export function isJweHeader(header: BaseJwtHeader & Record<string, any>): header is JweHeader {
  return ('enc' in header && header.enc && jweEnc(header.enc)) || (header.alg && jweAlg(header.alg))
}

export const COMPACT_JWS_REGEX = /^([a-zA-Z0-9_=-]+).([a-zA-Z0-9_=-]+)?.([a-zA-Z0-9_=-]+)?$/
export const COMPACT_JWE_REGEX = /^([a-zA-Z0-9_=-]+)\.([a-zA-Z0-9_=-]+)?\.([a-zA-Z0-9_=-]+)\.([a-zA-Z0-9_=-]+)?\.([a-zA-Z0-9_=-]+)?$/

export const JweAlgs = [
  'RSA1_5',
  'RSA-OAEP',
  'RSA-OAEP-256',
  'A128KW',
  'A192KW',
  'A256KW',
  'dir',
  'ECDH-ES' /*interop value*/,
  'ECDH-ES+A128KW',
  'ECDH-ES+A192KW',
  'ECDH-ES+A256KW',
  'A128GCMKW',
  'A192GCMKW',
  'A256GCMKW',
  'PBES2-HS256+A128KW',
  'PBES2-HS384+A192KW',
  'PBES2-HS512+A256KW',
] as const
export type JweAlg = (typeof JweAlgs)[number]
export function jweAlg(alg?: string | JweAlg): JweAlg | undefined {
  return JweAlgs.find((supportedVal) => supportedVal === alg)
}

export const JweEncs = ['A128CBC-HS256', 'A192CBC-HS384', 'A256CBC-HS512', 'A128GCM', 'A192GCM', 'A256GCM' /*interop value*/] as const
export type JweEnc = (typeof JweEncs)[number]

export function jweEnc(alg?: string | JweEnc): JweEnc | undefined {
  return JweEncs.find((supportedVal) => supportedVal === alg)
}
