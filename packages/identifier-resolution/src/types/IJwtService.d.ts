// Copy of jwt-service typings since we cannot include that as devDependency due to cyclic dep
/*
import {
  ExternalIdentifierDidOpts,
  ExternalIdentifierResult,
  ExternalIdentifierX5cOpts,
  IIdentifierResolution,
  ManagedIdentifierOptsOrResult,
  ManagedIdentifierResult,
} from '../types'*/
import type { ClientIdScheme } from '@sphereon/ssi-sdk-ext.x509-utils'
import type { BaseJWK, IValidationResult, JoseSignatureAlgorithm, JoseSignatureAlgorithmString, JWK } from '@sphereon/ssi-types'
import type { IAgentContext, IKeyManager, IPluginMethodMap } from '@veramo/core'
export type IRequiredContext = IAgentContext<IIdentifierResolution & IKeyManager>
export declare const jwtServiceContextMethods: Array<string>
export interface IJwtService extends IPluginMethodMap {
  jwtPrepareJws(args: CreateJwsJsonArgs, context: IRequiredContext): Promise<PreparedJwsObject>
  jwtCreateJwsJsonGeneralSignature(args: CreateJwsJsonArgs, context: IRequiredContext): Promise<JwsJsonGeneral>
  jwtCreateJwsJsonFlattenedSignature(args: CreateJwsFlattenedArgs, context: IRequiredContext): Promise<JwsJsonFlattened>
  jwtCreateJwsCompactSignature(args: CreateJwsCompactArgs, context: IRequiredContext): Promise<JwtCompactResult>
  jwtVerifyJwsSignature(args: VerifyJwsArgs, context: IRequiredContext): Promise<IJwsValidationResult>
  jwtEncryptJweCompactJwt(args: EncryptJweCompactJwtArgs, context: IRequiredContext): Promise<JwtCompactResult>
  jwtDecryptJweCompactJwt(args: DecryptJweCompactJwtArgs, context: IRequiredContext): Promise<JwtCompactResult>
}
export type IJwsValidationResult = IValidationResult & {
  jws: JwsJsonGeneralWithIdentifiers
}

export interface PreparedJws {
  protectedHeader: JwsHeader
  payload: Uint8Array
  unprotectedHeader?: JwsHeader
  existingSignatures?: Array<JwsJsonSignature>
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
export type EphemeralPublicKey = Omit<BaseJWK, 'alg'>
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
  b64: {
    payload: string
    protectedHeader: string
  }
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
  recipientKey: ExternalIdentifierResult & {
    kid?: string
  }
  alg?: JweAlg
  enc?: JweEnc
  apu?: string
  apv?: string
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
  encryptedKey: string | EphemeralPublicKey
  iv: string
  ciphertext: string
  tag: string
}
export type CreateJwsCompactArgs = CreateJwsArgs
export type CreateJwsFlattenedArgs = Exclude<CreateJwsJsonArgs, 'existingSignatures'>
export type VerifyJwsArgs = {
  jws: Jws
  jwk?: JWK
  opts?: {
    x5c?: Omit<ExternalIdentifierX5cOpts, 'identifier'>
    did?: Omit<ExternalIdentifierDidOpts, 'identifier'>
  }
}
/**
 * @public
 */
export type CreateJwsJsonArgs = CreateJwsArgs & {
  unprotectedHeader?: JwsHeader
  existingSignatures?: Array<JwsJsonSignature>
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
export declare function isJwsCompact(jws: Jws): jws is JwsCompact
export declare function isJweCompact(jwe: Jwe): jwe is JweCompact
export declare function isJwsJsonFlattened(jws: Jws): jws is JwsJsonFlattened
export declare function isJwsJsonGeneral(jws: Jws): jws is JwsJsonGeneral
export declare function isJweJsonFlattened(jwe: Jwe): jwe is JweJsonFlattened
export declare function isJweJsonGeneral(jwe: Jwe): jwe is JweJsonGeneral
export declare function isJwsHeader(header: BaseJwtHeader & Record<string, any>): header is JwsHeader
export declare function isJweHeader(header: BaseJwtHeader & Record<string, any>): header is JweHeader
export declare const COMPACT_JWS_REGEX: RegExp
export declare const COMPACT_JWE_REGEX: RegExp
export declare const JweAlgs: readonly [
  'RSA1_5',
  'RSA-OAEP',
  'RSA-OAEP-256',
  'A128KW',
  'A192KW',
  'A256KW',
  'dir',
  'ECDH-ES',
  'ECDH-ES+A128KW',
  'ECDH-ES+A192KW',
  'ECDH-ES+A256KW',
  'A128GCMKW',
  'A192GCMKW',
  'A256GCMKW',
  'PBES2-HS256+A128KW',
  'PBES2-HS384+A192KW',
  'PBES2-HS512+A256KW'
]
export type JweAlg = (typeof JweAlgs)[number]
export declare function jweAlg(alg?: string | JweAlg): JweAlg | undefined
export declare const JweEncs: readonly ['A128CBC-HS256', 'A192CBC-HS384', 'A256CBC-HS512', 'A128GCM', 'A192GCM', 'A256GCM']
export type JweEnc = (typeof JweEncs)[number]
export declare function jweEnc(alg?: string | JweEnc): JweEnc | undefined
//# sourceMappingURL=IJwtService.d.ts.map
