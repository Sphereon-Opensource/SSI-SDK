import {
  DIDDocumentSection,
  IAgentContext,
  IIdentifier,
  IPluginMethodMap,
  IResolver
} from '@veramo/core'
import { VerifiableCredential, VerifiablePresentation } from '@sphereon/pe-js'
import {
  ParsedAuthenticationRequestURI,
  VerifiedAuthenticationRequestWithJWT,
  VerifiablePresentationResponseOpts,
  VerifiablePresentationTypeFormat,
  PresentationLocation,
} from '@sphereon/did-auth-siop/dist/main/types/SIOP.types'
import { OperatingPartySession } from '../session/OperatingPartySession';

export interface IDidAuthSiopOpAuthenticator extends IPluginMethodMap {
  getDidSiopSession(args: IGetDidSiopSessionArgs, context: IRequiredContext): Promise<OperatingPartySession>
  addDidSiopSession(args: ICreateDidSiopSessionArgs, context: IRequiredContext): Promise<OperatingPartySession>
  removeDidSiopSession(args: IRemoveDidSiopSessionArgs, context: IRequiredContext): Promise<boolean>
  authenticateWithDidSiop(args: IAuthenticateWithDidSiopArgs, context: IRequiredContext): Promise<IResponse>
  getDidSiopAuthenticationRequestFromRP(
    args: IGetDidSiopAuthenticationRequestFromRpArgs,
    context: IRequiredContext
  ): Promise<ParsedAuthenticationRequestURI>
  getDidSiopAuthenticationRequestDetails(args: IGetDidSiopAuthenticationRequestDetailsArgs, context: IRequiredContext): Promise<IAuthRequestDetails>
  verifyDidSiopAuthenticationRequestURI(
    args: IVerifyDidSiopAuthenticationRequestUriArgs,
    context: IRequiredContext
  ): Promise<VerifiedAuthenticationRequestWithJWT>
  sendDidSiopAuthenticationResponse(args: ISendDidSiopAuthenticationResponseArgs, context: IRequiredContext): Promise<IResponse>
  registerCustomApprovalForDidSiop(args: IRegisterCustomApprovalForDidSiopArgs, context: IRequiredContext): Promise<void>
  removeCustomApprovalForDidSiop(args: IRemoveCustomApprovalForDidSiopArgs, context: IRequiredContext): Promise<boolean>
}

export interface IOperatingPartySessionArgs {
  sessionId: string
  identifier: IIdentifier
  context: IRequiredContext
  expiresIn?: number
  section?: DIDDocumentSection
}

export interface IAuthenticateWithDidSiopArgs {
  sessionId: string
  stateId: string
  redirectUrl: string
  didMethod: string
  customApproval?: ((verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT) => Promise<void>) | string
}

export interface IGetDidSiopAuthenticationRequestFromRpArgs {
  sessionId: string
  stateId: string
  redirectUrl: string
}

export interface IGetDidSiopAuthenticationRequestDetailsArgs {
  sessionId: string
  verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT
  verifiableCredentials: VerifiableCredential[]
}

export interface IVerifyDidSiopAuthenticationRequestUriArgs {
  sessionId: string
  requestURI: ParsedAuthenticationRequestURI
  didMethod?: string
}

export interface ISendDidSiopAuthenticationResponseArgs {
  sessionId: string
  verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT
  verifiablePresentationResponse?: VerifiablePresentationResponseOpts[]
}

export interface IAuthRequestDetails {
  id: string
  vpResponseOpts: VerifiablePresentationResponseOpts[]
  alsoKnownAs?: string[]
}

export interface IResponse extends Response {}

export interface IMatchedPresentationDefinition {
  location: PresentationLocation
  format: VerifiablePresentationTypeFormat
  presentation: VerifiablePresentation
}

export interface IGetDidSiopSessionArgs {
  sessionId: string
}

export interface ICreateDidSiopSessionArgs {
  sessionId: string
  identifier: IIdentifier
  expiresIn?: number
}

export interface IRemoveDidSiopSessionArgs {
  sessionId: string
}

export interface IRegisterCustomApprovalForDidSiopArgs {
  key: string
  customApproval: (verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT) => Promise<void>
}

export interface IRemoveCustomApprovalForDidSiopArgs {
  key: string
}

export interface IOpsAuthenticateWithDidSiopArgs {
  stateId: string
  redirectUrl: string
  customApprovals: Record<string, (verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT) => Promise<void>>
  customApproval?: ((verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT) => Promise<void>) | string
}

export interface IOpsGetDidSiopAuthenticationRequestFromRpArgs {
  stateId: string
  redirectUrl: string
}

export interface IOpsGetDidSiopAuthenticationRequestDetailsArgs {
  verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT
  verifiableCredentials: VerifiableCredential[]
}

export interface IOpsVerifyDidSiopAuthenticationRequestUriArgs {
  requestURI: ParsedAuthenticationRequestURI
  didMethod?: string
}

export interface IOpsSendDidSiopAuthenticationResponseArgs {
  verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT
  verifiablePresentationResponse?: VerifiablePresentationResponseOpts[]
}

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

export enum events {
  DID_SIOP_AUTHENTICATED = 'didSiopAuthenticated',
}

export type IRequiredContext = IAgentContext<IResolver>
