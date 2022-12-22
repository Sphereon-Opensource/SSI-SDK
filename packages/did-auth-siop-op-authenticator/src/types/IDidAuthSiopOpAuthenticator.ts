import { DIDDocumentSection, IAgentContext, IIdentifier, IPluginMethodMap, IResolver, IKeyManager } from '@veramo/core'
import { IPresentation, IVerifiableCredential } from '@sphereon/ssi-types'
import { OpSession } from '../session/OpSession'
import { ParsedAuthorizationRequestURI, VerifiedAuthorizationRequest, VerifiablePresentationWithLocation, PresentationDefinitionLocation, VerifiablePresentationTypeFormat } from '@sphereon/did-auth-siop'

import { Resolvable } from 'did-resolver'

export interface IDidAuthSiopOpAuthenticator extends IPluginMethodMap {
  getSessionForSiop(args: IGetSiopSessionArgs, context: IRequiredContext): Promise<OpSession>
  registerSessionForSiop(args: IRegisterSiopSessionArgs, context: IRequiredContext): Promise<OpSession>
  removeSessionForSiop(args: IRemoveSiopSessionArgs, context: IRequiredContext): Promise<boolean>
  authenticateWithSiop(args: IAuthenticateWithSiopArgs, context: IRequiredContext): Promise<IResponse>
  getSiopAuthenticationRequestFromRP(
    args: IGetSiopAuthenticationRequestFromRpArgs,
    context: IRequiredContext
  ): Promise<ParsedAuthorizationRequestURI>
  getSiopAuthenticationRequestDetails(args: IGetSiopAuthorizationRequestDetailsArgs, context: IRequiredContext): Promise<IAuthRequestDetails>
  verifySiopAuthorizationRequestURI(
    args: IVerifySiopAuthenticationRequestUriArgs,
    context: IRequiredContext
  ): Promise<VerifiedAuthorizationRequest>
  sendSiopAuthenticationResponse(args: ISendSiopAuthenticationResponseArgs, context: IRequiredContext): Promise<IResponse>
  registerCustomApprovalForSiop(args: IRegisterCustomApprovalForSiopArgs, context: IRequiredContext): Promise<void>
  removeCustomApprovalForSiop(args: IRemoveCustomApprovalForSiopArgs, context: IRequiredContext): Promise<boolean>
}
export interface PerDidResolver {
  didMethod: string
  resolver: Resolvable
}

export interface IOpSessionArgs {
  sessionId: string
  identifier: IIdentifier
  context: IRequiredContext
  supportedDidMethods?: string[]
  resolver?: Resolvable
  perDidResolvers?: PerDidResolver[]
  expiresIn?: number
  verificationMethodSection?: DIDDocumentSection
}

export interface IAuthenticateWithSiopArgs {
  sessionId: string
  stateId: string
  redirectUrl: string
  customApproval?: ((verifiedAuthenticationRequest: VerifiedAuthorizationRequest, sessionId: string) => Promise<void>) | string
}

export interface IGetSiopAuthenticationRequestFromRpArgs {
  sessionId: string
  stateId: string
  redirectUrl: string
}

export interface IGetSiopAuthorizationRequestDetailsArgs {
  sessionId: string
  verifiedAuthorizationRequest: VerifiedAuthorizationRequest
  verifiableCredentials: IVerifiableCredential[]
}

export interface IVerifySiopAuthenticationRequestUriArgs {
  sessionId: string
  requestURI: ParsedAuthorizationRequestURI
}

export interface ISendSiopAuthenticationResponseArgs {
  sessionId: string
  verifiedAuthenticationRequest: VerifiedAuthorizationRequest
  verifiablePresentationResponse?: VerifiablePresentationWithLocation[]
}

export interface IAuthRequestDetails {
  id: string
  vpResponseOpts: VerifiablePresentationWithLocation[]
  alsoKnownAs?: string[]
}

export interface IResponse extends Response {}

export interface IMatchedPresentationDefinition {
  location: PresentationDefinitionLocation
  format: VerifiablePresentationTypeFormat
  presentation: IPresentation
}

export interface IGetSiopSessionArgs {
  sessionId: string
}

export interface IRegisterSiopSessionArgs {
  identifier: IIdentifier
  resolver?: Resolvable
  perDidResolvers?: PerDidResolver[]
  supportedDidMethods?: string[]
  sessionId?: string
  expiresIn?: number
}

export interface IRemoveSiopSessionArgs {
  sessionId: string
}

export interface IRegisterCustomApprovalForSiopArgs {
  key: string
  customApproval: (verifiedAuthenticationRequest: VerifiedAuthorizationRequest, sessionId: string) => Promise<void>
}

export interface IRemoveCustomApprovalForSiopArgs {
  key: string
}

export interface IOpsAuthenticateWithSiopArgs {
  stateId: string
  redirectUrl: string
  customApprovals: Record<string, (verifiedAuthenticationRequest: VerifiedAuthorizationRequest, sessionId: string) => Promise<void>>
  customApproval?: ((verifiedAuthenticationRequest: VerifiedAuthorizationRequest, sessionId: string) => Promise<void>) | string
}

export interface IOpsGetSiopAuthorizationRequestFromRpArgs {
  stateId?: string
  redirectUrl: string
}

export interface IOpsGetSiopAuthorizationRequestDetailsArgs {
  verifiedAuthorizationRequest: VerifiedAuthorizationRequest
  verifiableCredentials: IVerifiableCredential[]
}

export interface IOpsVerifySiopAuthorizationRequestUriArgs {
  requestURI: ParsedAuthorizationRequestURI
}

export interface IOpsSendSiopAuthorizationResponseArgs {
  verifiedAuthenticationRequest: VerifiedAuthorizationRequest
  verifiablePresentationResponse?: VerifiablePresentationWithLocation[]
}

export enum events {
  DID_SIOP_AUTHENTICATED = 'didSiopAuthenticated',
}

export type IRequiredContext = IAgentContext<IResolver & IKeyManager>
