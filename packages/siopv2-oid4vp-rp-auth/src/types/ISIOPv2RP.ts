import {
  AuthorizationRequestPayload,
  AuthorizationRequestState,
  AuthorizationResponsePayload,
  AuthorizationResponseState,
  ClaimPayloadCommonOpts,
  ClientMetadataOpts,
  IRPSessionManager,
  PresentationVerificationCallback,
  RequestObjectPayload,
  ResponseMode,
  ResponseURIType,
  SupportedVersion,
  VerifiedAuthorizationResponse,
  VerifyJwtCallback,
} from '@sphereon/did-auth-siop'
import { CheckLinkedDomain } from '@sphereon/did-auth-siop-adapter'
import { DIDDocument } from '@sphereon/did-uni-client'
import { JwtIssuer } from '@sphereon/oid4vc-common'
import { IPresentationDefinition } from '@sphereon/pex'
import { IDIDOptions } from '@sphereon/ssi-sdk-ext.did-utils'
import { ExternalIdentifierOIDFEntityIdOpts, IIdentifierResolution, ManagedIdentifierOptsOrResult } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { IJwtService } from '@sphereon/ssi-sdk-ext.jwt-service'
import { ICredentialValidation, SchemaValidation } from '@sphereon/ssi-sdk.credential-validation'
import { ImDLMdoc } from '@sphereon/ssi-sdk.mdl-mdoc'
import { IPDManager, VersionControlMode } from '@sphereon/ssi-sdk.pd-manager'
import { IPresentationExchange } from '@sphereon/ssi-sdk.presentation-exchange'
import { ISDJwtPlugin } from '@sphereon/ssi-sdk.sd-jwt'
import { AuthorizationRequestStateStatus } from '@sphereon/ssi-sdk.siopv2-oid4vp-common'
import { AdditionalClaims, DcqlQueryREST, HasherSync } from '@sphereon/ssi-types'
import { VerifyCallback } from '@sphereon/wellknown-dids-client'
import { IAgentContext, ICredentialIssuer, ICredentialVerifier, IDIDManager, IKeyManager, IPluginMethodMap, IResolver } from '@veramo/core'

import { Resolvable } from 'did-resolver'
import { EventEmitter } from 'events'

export enum VerifiedDataMode {
  NONE = 'none',
  VERIFIED_PRESENTATION = 'vp',
  CREDENTIAL_SUBJECT_FLATTENED = 'cs-flat',
}

export interface ISIOPv2RP extends IPluginMethodMap {
  siopCreateAuthRequestURI(createArgs: ICreateAuthRequestArgs, context: IRequiredContext): Promise<string>
  siopCreateAuthRequestPayloads(createArgs: ICreateAuthRequestArgs, context: IRequiredContext): Promise<IAuthorizationRequestPayloads>
  siopGetAuthRequestState(args: IGetAuthRequestStateArgs, context: IRequiredContext): Promise<AuthorizationRequestState | undefined>
  siopGetAuthResponseState(
    args: IGetAuthResponseStateArgs,
    context: IRequiredContext,
  ): Promise<AuthorizationResponseStateWithVerifiedData | undefined>
  siopUpdateAuthRequestState(args: IUpdateRequestStateArgs, context: IRequiredContext): Promise<AuthorizationRequestState>
  siopDeleteAuthState(args: IDeleteAuthStateArgs, context: IRequiredContext): Promise<boolean>
  siopVerifyAuthResponse(args: IVerifyAuthResponseStateArgs, context: IRequiredContext): Promise<VerifiedAuthorizationResponse>
  siopImportDefinitions(args: ImportDefinitionsArgs, context: IRequiredContext): Promise<void>

  siopGetRedirectURI(args: IGetRedirectUriArgs, context: IRequiredContext): Promise<string | undefined>
}

export interface ISiopv2RPOpts {
  defaultOpts?: IRPDefaultOpts
  instanceOpts?: IPEXInstanceOptions[]
}

export interface IRPDefaultOpts extends IRPOptions {}

export interface ICreateAuthRequestArgs {
  definitionId: string
  correlationId: string
  responseURIType: ResponseURIType
  responseURI: string
  responseRedirectURI?: string
  jwtIssuer?: JwtIssuer
  requestByReferenceURI?: string
  nonce?: string
  state?: string
  claims?: ClaimPayloadCommonOpts
}

export interface IGetAuthRequestStateArgs {
  correlationId: string
  definitionId: string
  errorOnNotFound?: boolean
}

export interface IGetAuthResponseStateArgs {
  correlationId: string
  definitionId: string
  errorOnNotFound?: boolean
  progressRequestStateTo?: AuthorizationRequestStateStatus
  includeVerifiedData?: VerifiedDataMode
}

export interface IUpdateRequestStateArgs {
  definitionId: string
  correlationId: string
  state: AuthorizationRequestStateStatus
  error?: string
}

export interface IDeleteAuthStateArgs {
  correlationId: string
  definitionId: string
}

export interface IVerifyAuthResponseStateArgs {
  authorizationResponse: string | AuthorizationResponsePayload
  definitionId?: string
  correlationId: string
  audience?: string
  dcqlQuery?: DcqlQueryREST
}

export interface IDefinitionPair {
  definitionPayload?: IPresentationDefinition
  dcqlPayload?: DcqlQueryREST
}

export interface ImportDefinitionsArgs {
  definitions: Array<IDefinitionPair>
  tenantId?: string
  version?: string
  versionControlMode?: VersionControlMode
}

export interface IGetRedirectUriArgs {
  correlationId: string
  definitionId?: string
  state?: string
}

export interface IAuthorizationRequestPayloads {
  authorizationRequest: AuthorizationRequestPayload
  requestObject?: string
  requestObjectDecoded?: RequestObjectPayload
}

export interface IPEXDefinitionPersistArgs extends IPEXInstanceOptions {
  definition: IPresentationDefinition
  ttl?: number
}

export interface ISiopRPInstanceArgs {
  definitionId?: string
  responseRedirectURI?: string
}

export interface IPEXInstanceOptions extends IPEXOptions {
  rpOpts?: IRPOptions
}

export interface IRPOptions {
  responseMode?: ResponseMode
  supportedVersions?: SupportedVersion[] // The supported version by the RP. The first version will be the default version
  sessionManager?: IRPSessionManager
  clientMetadataOpts?: ClientMetadataOpts
  expiresIn?: number
  eventEmitter?: EventEmitter
  credentialOpts?: CredentialOpts
  verificationPolicies?: VerificationPolicies
  identifierOpts: ISIOPIdentifierOptions
  verifyJwtCallback?: VerifyJwtCallback
  responseRedirectUri?: string
}

export interface IPEXOptions {
  presentationVerifyCallback?: PresentationVerificationCallback
  // definition?: IPresentationDefinition
  definitionId: string
  version?: string
  tenantId?: string
}

export type VerificationPolicies = {
  schemaValidation: SchemaValidation
}

export interface PerDidResolver {
  didMethod: string
  resolver: Resolvable
}

export interface IAuthRequestDetails {
  rpDIDDocument?: DIDDocument
  id: string
  alsoKnownAs?: string[]
}

export interface ISIOPIdentifierOptions extends Omit<IDIDOptions, 'idOpts'> {
  // we replace the legacy idOpts with the Managed Identifier opts from the identifier resolution module
  idOpts: ManagedIdentifierOptsOrResult
  oidfOpts?: ExternalIdentifierOIDFEntityIdOpts
  checkLinkedDomains?: CheckLinkedDomain
  wellknownDIDVerifyCallback?: VerifyCallback
}

// todo make the necessary changes for mdl-mdoc types
export type CredentialOpts = {
  hasher?: HasherSync
}

export interface AuthorizationResponseStateWithVerifiedData extends AuthorizationResponseState {
  verifiedData?: AdditionalClaims
}

export type IRequiredContext = IAgentContext<
  IResolver &
    IDIDManager &
    IKeyManager &
    IIdentifierResolution &
    ICredentialIssuer &
    ICredentialValidation &
    ICredentialVerifier &
    IPresentationExchange &
    IPDManager &
    ISDJwtPlugin &
    IJwtService &
    ImDLMdoc
>
