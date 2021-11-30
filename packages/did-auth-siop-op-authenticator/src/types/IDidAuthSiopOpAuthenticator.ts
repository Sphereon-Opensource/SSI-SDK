import {
  IAgentContext,
  IPluginMethodMap,
} from '@veramo/core'
import { VerifiableCredential, VerifiablePresentation } from '@sphereon/pe-js'
import {
  ParsedAuthenticationRequestURI,
  VerifiedAuthenticationRequestWithJWT,
  VerifiablePresentationResponseOpts,
  VerifiablePresentationTypeFormat,
  PresentationLocation,
} from '@sphereon/did-auth-siop/dist/main/types/SIOP.types'

import { OP } from '@sphereon/did-auth-siop/dist/main'

export interface IDidAuthSiopOpAuthenticator extends IPluginMethodMap {
  authenticateWithDidSiop(args: IAuthenticateWithDidSiopArgs, context: IRequiredContext): Promise<IResponse>;
  getDidSiopAuthenticationRequestFromRP(args: IGetDidSiopAuthenticationRequestFromRpArgs, context: IRequiredContext): Promise<ParsedAuthenticationRequestURI>;
  getDidSiopAuthenticationRequestDetails(args: getDidSiopAuthenticationRequestDetailsArgs, context: IRequiredContext): Promise<IAuthRequestDetails>;
  verifyDidSiopAuthenticationRequestURI(args: IVerifyDidSiopAuthenticationRequestUriArgs, context: IRequiredContext): Promise<VerifiedAuthenticationRequestWithJWT>;
  sendDidSiopAuthenticationResponse(args: ISendDidSiopAuthenticationResponseArgs, context: IRequiredContext): Promise<IResponse>;
}

export interface IDidAuthSiopOpAuthenticatorArgs {
  did: string;
  kid: string;
  privateKey: string;
  expiresIn?: number;
  didMethod?: string;
}

export interface IGetDidSiopAuthenticationRequestFromRpArgs {
  stateId: string;
  redirectUrl: string;
}

export interface IAuthenticateWithDidSiopArgs {
  stateId: string;
  redirectUrl: string;
  didMethod: string;
}

export interface getDidSiopAuthenticationRequestDetailsArgs {
  verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT;
  verifiableCredentials: VerifiableCredential[];
}

export interface IVerifyDidSiopAuthenticationRequestUriArgs {
  requestURI: ParsedAuthenticationRequestURI;
  didMethod?: string;
}

export interface ISendDidSiopAuthenticationResponseArgs {
  verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT;
  verifiablePresentationResponse?: VerifiablePresentationResponseOpts[];
}

export interface IAuthRequestDetails {
  id: string;
  alsoKnownAs?: string[];
  vpResponseOpts: VerifiablePresentationResponseOpts[];
}

export interface IResponse extends Response {
}

export interface IMatchedPresentationDefinition {
  location: PresentationLocation;
  format: VerifiablePresentationTypeFormat;
  presentation: VerifiablePresentation;
}

export enum events {
  DID_SIOP_AUTHENTICATED = 'didSiopAuthenticated',
}

export type IRequiredContext = IAgentContext<Record<string, never>>;
