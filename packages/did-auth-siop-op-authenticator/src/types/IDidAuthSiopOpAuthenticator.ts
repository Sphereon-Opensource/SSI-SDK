import {
  DIDDocumentSection,
  IAgentContext,
  IIdentifier,
  IPluginMethodMap,
  IResolver,
  IKeyManager,
  IDataStoreORM,
  FindCredentialsArgs,
  ICredentialIssuer,
} from '@veramo/core'
import { IPresentation, IVerifiableCredential } from '@sphereon/ssi-types'
import { OpSession } from '../session/OpSession'
import {
  ParsedAuthorizationRequestURI,
  VerifiedAuthorizationRequest,
  VerifiablePresentationWithLocation,
  PresentationLocation,
  VerifiablePresentationTypeFormat,
  PresentationSignCallback,
} from '@sphereon/did-auth-siop'
import { VerifyCallback } from '@sphereon/wellknown-dids-client'

import { Resolvable } from 'did-resolver'

export interface IDidAuthSiopOpAuthenticator extends IPluginMethodMap {
  getSessionForSiop(args: IGetSiopSessionArgs, context: IRequiredContext): Promise<OpSession>
  registerSessionForSiop(args: IRegisterSiopSessionArgs, context: IRequiredContext): Promise<OpSession>
  removeSessionForSiop(args: IRemoveSiopSessionArgs, context: IRequiredContext): Promise<boolean>
  authenticateWithSiop(args: IAuthenticateWithSiopArgs, context: IRequiredContext): Promise<IResponse>
  getSiopAuthorizationRequestFromRP(args: IGetSiopAuthorizationRequestFromRpArgs, context: IRequiredContext): Promise<ParsedAuthorizationRequestURI>
  getSiopAuthorizationRequestDetails(args: IGetSiopAuthorizationRequestDetailsArgs, context: IRequiredContext): Promise<IAuthRequestDetails>
  verifySiopAuthorizationRequestURI(args: IVerifySiopAuthorizationRequestUriArgs, context: IRequiredContext): Promise<VerifiedAuthorizationRequest>
  sendSiopAuthorizationResponse(args: ISendSiopAuthorizationResponseArgs, context: IRequiredContext): Promise<IResponse>
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
  verifiablePresentationResponse?: VerifiablePresentationWithLocation[]
}

export interface IAuthRequestDetails {
  id: string
  vpResponseOpts: VerifiablePresentationWithLocation[]
  alsoKnownAs?: string[]
}

export interface IResponse extends Response {}

export interface IMatchedPresentationDefinition {
  location: PresentationLocation
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
  wellKnownDidVerifyCallback: VerifyCallback
  presentationSignCallback: PresentationSignCallback
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
  verifiedAuthorizationRequest: VerifiedAuthorizationRequest
  verifiableCredentials: IVerifiableCredential[]
  signingOptions?: {
    nonce?: string
    domain?: string
  }
  presentationSignCallback: PresentationSignCallback
}

export interface IOpsVerifySiopAuthorizationRequestUriArgs {
  requestURI: ParsedAuthorizationRequestURI
}

export interface IOpsSendSiopAuthorizationResponseArgs {
  verifiedAuthorizationRequest: VerifiedAuthorizationRequest
  verifiablePresentationResponse?: VerifiablePresentationWithLocation[]
}

export enum events {
  DID_SIOP_AUTHENTICATED = 'didSiopAuthenticated',
}

export type IRequiredContext = IAgentContext<IDataStoreORM & IResolver & IKeyManager & ICredentialIssuer>
