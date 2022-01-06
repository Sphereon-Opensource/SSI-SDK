import { DIDDocumentSection, IAgentContext, IIdentifier, IPluginMethodMap, IResolver } from '@veramo/core'
import { IVerifiableCredential, IVerifiablePresentation } from '@sphereon/pex'
import {
  ParsedAuthenticationRequestURI,
  VerifiedAuthenticationRequestWithJWT,
  VerifiablePresentationResponseOpts,
  VerifiablePresentationTypeFormat,
  PresentationLocation,
} from '@sphereon/did-auth-siop/dist/main/types/SIOP.types'
import { OpSession } from '../session/OpSession'

export interface IDidAuthSiopOpAuthenticator extends IPluginMethodMap {
  getSessionForSiop(args: IGetSiopSessionArgs, context: IRequiredContext): Promise<OpSession>
  registerSessionForSiop(args: IRegisterSiopSessionArgs, context: IRequiredContext): Promise<OpSession>
  removeSessionForSiop(args: IRemoveSiopSessionArgs, context: IRequiredContext): Promise<boolean>
  authenticateWithSiop(args: IAuthenticateWithSiopArgs, context: IRequiredContext): Promise<IResponse>
  getSiopAuthenticationRequestFromRP(
    args: IGetSiopAuthenticationRequestFromRpArgs,
    context: IRequiredContext
  ): Promise<ParsedAuthenticationRequestURI>
  getSiopAuthenticationRequestDetails(args: IGetSiopAuthenticationRequestDetailsArgs, context: IRequiredContext): Promise<IAuthRequestDetails>
  verifySiopAuthenticationRequestURI(
    args: IVerifySiopAuthenticationRequestUriArgs,
    context: IRequiredContext
  ): Promise<VerifiedAuthenticationRequestWithJWT>
  sendSiopAuthenticationResponse(args: ISendSiopAuthenticationResponseArgs, context: IRequiredContext): Promise<IResponse>
  registerCustomApprovalForSiop(args: IRegisterCustomApprovalForSiopArgs, context: IRequiredContext): Promise<void>
  removeCustomApprovalForSiop(args: IRemoveCustomApprovalForSiopArgs, context: IRequiredContext): Promise<boolean>
}

export interface IOpSessionArgs {
  sessionId: string
  identifier: IIdentifier
  context: IRequiredContext
  expiresIn?: number
  verificationMethodSection?: DIDDocumentSection
}

export interface IAuthenticateWithSiopArgs {
  sessionId: string
  stateId: string
  redirectUrl: string
  customApproval?: ((verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT) => Promise<void>) | string
}

export interface IGetSiopAuthenticationRequestFromRpArgs {
  sessionId: string
  stateId: string
  redirectUrl: string
}

export interface IGetSiopAuthenticationRequestDetailsArgs {
  sessionId: string
  verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT
  verifiableCredentials: IVerifiableCredential[]
}

export interface IVerifySiopAuthenticationRequestUriArgs {
  sessionId: string
  requestURI: ParsedAuthenticationRequestURI
}

export interface ISendSiopAuthenticationResponseArgs {
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
  presentation: IVerifiablePresentation
}

export interface IGetSiopSessionArgs {
  sessionId: string
}

export interface IRegisterSiopSessionArgs {
  identifier: IIdentifier
  sessionId?: string
  expiresIn?: number
}

export interface IRemoveSiopSessionArgs {
  sessionId: string
}

export interface IRegisterCustomApprovalForSiopArgs {
  key: string
  customApproval: (verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT) => Promise<void>
}

export interface IRemoveCustomApprovalForSiopArgs {
  key: string
}

export interface IOpsAuthenticateWithSiopArgs {
  stateId: string
  redirectUrl: string
  customApprovals: Record<string, (verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT) => Promise<void>>
  customApproval?: ((verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT) => Promise<void>) | string
}

export interface IOpsGetSiopAuthenticationRequestFromRpArgs {
  stateId: string
  redirectUrl: string
}

export interface IOpsGetSiopAuthenticationRequestDetailsArgs {
  verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT
  verifiableCredentials: IVerifiableCredential[]
}

export interface IOpsVerifySiopAuthenticationRequestUriArgs {
  requestURI: ParsedAuthenticationRequestURI
}

export interface IOpsSendSiopAuthenticationResponseArgs {
  verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT
  verifiablePresentationResponse?: VerifiablePresentationResponseOpts[]
}

export enum events {
  DID_SIOP_AUTHENTICATED = 'didSiopAuthenticated',
}

export type IRequiredContext = IAgentContext<IResolver>
