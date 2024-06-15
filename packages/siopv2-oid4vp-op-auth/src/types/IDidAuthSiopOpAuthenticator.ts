import {
  CheckLinkedDomain,
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
import { DIDDocument } from '@sphereon/did-uni-client'
import { VerifiablePresentationResult } from '@sphereon/pex'
import { IIdentifierOpts } from '@sphereon/ssi-sdk-ext.did-utils'
import { PresentationSubmission, W3CVerifiableCredential, W3CVerifiablePresentation } from '@sphereon/ssi-types'
import { VerifyCallback } from '@sphereon/wellknown-dids-client'
import {
  IAgentContext,
  ICredentialIssuer,
  ICredentialVerifier,
  IDataStoreORM,
  IDIDManager,
  IKeyManager,
  IPluginMethodMap,
  IResolver,
} from '@veramo/core'
import { EventEmitter } from 'events'
import { OpSession } from '../session/OpSession'
import { IPDManager } from '@sphereon/ssi-sdk.pd-manager'
import { SiopV2MachineInstanceOpts, SiopV2MachineInterpreter, SiopV2MachineState } from './siopV2'

export interface IDidAuthSiopOpAuthenticator extends IPluginMethodMap {
  siopGetOPSession(args: IGetSiopSessionArgs, context: IRequiredContext): Promise<OpSession>
  siopRegisterOPSession(args: Omit<IOpSessionArgs, 'context'>, context: IRequiredContext): Promise<OpSession>
  siopRemoveOPSession(args: IRemoveSiopSessionArgs, context: IRequiredContext): Promise<boolean>
  siopRegisterOPCustomApproval(args: IRegisterCustomApprovalForSiopArgs, context: IRequiredContext): Promise<void>
  siopRemoveOPCustomApproval(args: IRemoveCustomApprovalForSiopArgs, context: IRequiredContext): Promise<boolean>
  siopGetMachineInterpreter(args: GetMachineArgs, context: IRequiredContext): Promise<SiopV2MachineInterpreter>
}

export interface IOpSessionArgs {
  sessionId?: string

  requestJwtOrUri: string | URI
  // identifier: IIdentifier
  context: IRequiredContext
  op?: IOPOptions
}

export interface IAuthRequestDetails {
  rpDIDDocument?: DIDDocument
  id: string
  verifiablePresentationMatches: IPresentationWithDefinition[]
  alsoKnownAs?: string[]
}

export interface IPresentationWithDefinition {
  location: VPTokenLocation
  definition: PresentationDefinitionWithLocation
  format: VerifiablePresentationTypeFormat
  presentation: W3CVerifiablePresentation
}

export interface IGetSiopSessionArgs {
  sessionId: string
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

export type GetMachineArgs = {
  opts: SiopV2MachineInstanceOpts
  stateNavigationListener?: (siopv2Machine: SiopV2MachineInterpreter, state: SiopV2MachineState, navigation?: any) => Promise<void>
}

export interface IOpsSendSiopAuthorizationResponseArgs {
  responseSignerOpts: IIdentifierOpts
  // verifiedAuthorizationRequest: VerifiedAuthorizationRequest
  presentationSubmission?: PresentationSubmission
  verifiablePresentations?: W3CVerifiablePresentation[]
}

export enum events {
  DID_SIOP_AUTHENTICATED = 'didSiopAuthenticated',
}

export type IRequiredContext = IAgentContext<
  IDataStoreORM & IResolver & IDIDManager & IKeyManager & ICredentialIssuer & ICredentialVerifier & IPDManager
>

export interface IOPOptions {
  responseMode?: ResponseMode
  supportedVersions?: SupportedVersion[]
  expiresIn?: number
  checkLinkedDomains?: CheckLinkedDomain
  eventEmitter?: EventEmitter
  supportedDIDMethods?: string[]

  wellknownDIDVerifyCallback?: VerifyCallback

  presentationSignCallback?: PresentationSignCallback

  resolveOpts?: ResolveOpts
}
/*
export interface IIdentifierOpts {
  identifier: IIdentifier
  verificationMethodSection?: DIDDocumentSection
  kid?: string
}*/

export interface VerifiableCredentialsWithDefinition {
  definition: PresentationDefinitionWithLocation
  credentials: W3CVerifiableCredential[]
}

export interface VerifiablePresentationWithDefinition extends VerifiablePresentationResult {
  definition: PresentationDefinitionWithLocation
  verifiableCredentials: W3CVerifiableCredential[]
  identifierOpts: IIdentifierOpts
}
export const DEFAULT_JWT_PROOF_TYPE = 'JwtProof2020'

export enum SupportedLanguage {
  ENGLISH = 'en',
  DUTCH = 'nl',
}
