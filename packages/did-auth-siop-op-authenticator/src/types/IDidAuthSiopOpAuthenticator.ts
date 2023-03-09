import {
  DIDDocumentSection,
  FindCredentialsArgs,
  IAgentContext,
  ICredentialIssuer,
  ICredentialVerifier,
  IDataStoreORM,
  IDIDManager,
  IIdentifier,
  IKeyManager,
  IPluginMethodMap,
  IResolver,
} from '@veramo/core'
import { W3CVerifiableCredential, W3CVerifiablePresentation } from '@sphereon/ssi-types'
import { OpSession } from '../session/OpSession'
import {
  CheckLinkedDomain,
  ParsedAuthorizationRequestURI,
  PresentationDefinitionWithLocation,
  PresentationSignCallback,
  ResolveOpts,
  ResponseMode,
  SupportedVersion,
  URI,
  VerifiablePresentationTypeFormat,
  VerifiedAuthorizationRequest,
  VPTokenLocation,
} from '@sphereon/did-auth-siop'
import { VerifyCallback } from '@sphereon/wellknown-dids-client'

import { Resolvable } from 'did-resolver'
import { DIDDocument } from '@sphereon/did-uni-client'
import { EventEmitter } from 'events'

export interface IDidAuthSiopOpAuthenticator extends IPluginMethodMap {
  siopGetOPSession(args: IGetSiopSessionArgs, context: IRequiredContext): Promise<OpSession>
  siopRegisterOPSession(args: Omit<IOpSessionArgs, 'context'>, context: IRequiredContext): Promise<OpSession>
  siopRemoveOPSession(args: IRemoveSiopSessionArgs, context: IRequiredContext): Promise<boolean>
  /*authenticateWithSiop(args: IAuthenticateWithSiopArgs, context: IRequiredContext): Promise<IResponse>
  getSiopAuthorizationRequestFromRP(args: IGetSiopAuthorizationRequestFromRpArgs, context: IRequiredContext): Promise<ParsedAuthorizationRequestURI>
  getSiopAuthorizationRequestDetails(args: IGetSiopAuthorizationRequestDetailsArgs, context: IRequiredContext): Promise<IAuthRequestDetails>
  verifySiopAuthorizationRequestURI(args: IVerifySiopAuthorizationRequestUriArgs, context: IRequiredContext): Promise<VerifiedAuthorizationRequest>
  sendSiopAuthorizationResponse(args: ISendSiopAuthorizationResponseArgs, context: IRequiredContext): Promise<IResponse>*/
  siopRegisterOPCustomApproval(args: IRegisterCustomApprovalForSiopArgs, context: IRequiredContext): Promise<void>
  siopRemoveOPCustomApproval(args: IRemoveCustomApprovalForSiopArgs, context: IRequiredContext): Promise<boolean>
}
export interface PerDidResolver {
  didMethod: string
  resolver: Resolvable
}

export interface IOpSessionArgs {
  sessionId?: string

  requestJwtOrUri: string | URI
  // identifier: IIdentifier
  context: IRequiredContext
  op?: IOPOptions

  /*supportedDidMethods?: string[]
  resolver?: Resolvable
  perDidResolvers?: PerDidResolver[]
  expiresIn?: number
  verificationMethodSection?: DIDDocumentSection*/
}

export interface IAuthenticateWithSiopArgs {
  sessionId: string
  stateId: string
  redirectUrl: string
  customApproval?: ((verifiedAuthorizationRequest: VerifiedAuthorizationRequest, sessionId: string) => Promise<void>) | string
}

export interface IGetSiopAuthorizationRequestFromRpArgs {
  sessionId: string
  stateId: string
  redirectUrl: string
}

export interface IGetSiopAuthorizationRequestDetailsArgs {
  sessionId: string
  verifiedAuthorizationRequest: VerifiedAuthorizationRequest
  credentialFilter?: FindCredentialsArgs
  signingOptions?: {
    nonce?: string
    domain?: string
  }
}

export interface IVerifySiopAuthorizationRequestUriArgs {
  sessionId: string
  requestURI: ParsedAuthorizationRequestURI
}

export interface ISendSiopAuthorizationResponseArgs {
  sessionId: string
  verifiedAuthorizationRequest: VerifiedAuthorizationRequest
  verifiablePresentationResponse?: W3CVerifiablePresentation[]
}

export interface IAuthRequestDetails {
  rpDIDDocument?: DIDDocument
  id: string
  verifiablePresentationMatches: IPresentationWithDefinition[]
  alsoKnownAs?: string[]
}

export interface IResponse extends Response {}

export interface IPresentationWithDefinition {
  location: VPTokenLocation
  definition: PresentationDefinitionWithLocation
  format: VerifiablePresentationTypeFormat
  presentation: W3CVerifiablePresentation
}

export interface IGetSiopSessionArgs {
  sessionId: string
}

export interface IRegisterSiopSessionArgs {
  // identifier: IIdentifier
  resolver?: Resolvable
  perDidResolvers?: PerDidResolver[]
  supportedDidMethods?: string[]
  wellKnownDidVerifyCallback?: VerifyCallback
  presentationSignCallback?: PresentationSignCallback
  sessionId?: string
  expiresIn?: number
}

export interface IRemoveSiopSessionArgs {
  sessionId: string
}

export interface IRegisterCustomApprovalForSiopArgs {
  key: string
  customApproval: (verifiedAuthorizationRequest: VerifiedAuthorizationRequest, sessionId: string) => Promise<void>
}

export interface IRemoveCustomApprovalForSiopArgs {
  key: string
}

export interface IOpsAuthenticateWithSiopArgs {
  stateId: string
  redirectUrl: string
  customApprovals: Record<string, (verifiedAuthorizationRequest: VerifiedAuthorizationRequest, sessionId: string) => Promise<void>>
  customApproval?: ((verifiedAuthorizationRequest: VerifiedAuthorizationRequest, sessionId: string) => Promise<void>) | string
}

export interface IOpsGetSiopAuthorizationRequestFromRpArgs {
  stateId?: string
  redirectUrl: string
}

export interface IOpsGetSiopAuthorizationRequestDetailsArgs {
  verifiableCredentials: W3CVerifiableCredential[]
  signingOptions?: {
    nonce?: string
    domain?: string
  }
  identifierOpts?: IIdentifierOpts
}

export interface IOpsVerifySiopAuthorizationRequestUriArgs {
  requestURI: ParsedAuthorizationRequestURI
}

export interface IOpsSendSiopAuthorizationResponseArgs {
  responseSignerOpts: IIdentifierOpts
  // verifiedAuthorizationRequest: VerifiedAuthorizationRequest
  verifiablePresentations?: W3CVerifiablePresentation[]
}

export enum events {
  DID_SIOP_AUTHENTICATED = 'didSiopAuthenticated',
}

export type IRequiredContext = IAgentContext<IDataStoreORM & IResolver & IDIDManager & IKeyManager & ICredentialIssuer & ICredentialVerifier>

export interface IOPOptions {
  responseMode?: ResponseMode
  supportedVersions?: SupportedVersion[]
  expiresIn?: number
  checkLinkedDomains?: CheckLinkedDomain
  // customResolver?: Resolver
  eventEmitter?: EventEmitter
  supportedDIDMethods?: string[]

  wellknownDIDVerifyCallback?: VerifyCallback

  presentationSignCallback?: PresentationSignCallback

  resolveOpts?: ResolveOpts
}

export interface IIdentifierOpts {
  identifier: IIdentifier
  verificationMethodSection?: DIDDocumentSection
  kid?: string
}

export interface VerifiableCredentialsWithDefinition {
  definition: PresentationDefinitionWithLocation
  credentials: W3CVerifiableCredential[]
}

export interface VerifiablePresentationWithDefinition {
  definition: PresentationDefinitionWithLocation
  credentials: W3CVerifiableCredential[]
  presentation: W3CVerifiablePresentation
  identifierOpts: IIdentifierOpts
}
export const DEFAULT_JWT_PROOF_TYPE = 'JwtProof2020'
