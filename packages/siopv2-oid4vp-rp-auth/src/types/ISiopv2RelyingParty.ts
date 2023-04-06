import {
  DIDDocumentSection,
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
import { W3CVerifiablePresentation } from '@sphereon/ssi-types'
import {
  CheckLinkedDomain,
  IRPSessionManager,
  PresentationDefinitionWithLocation,
  PresentationVerificationCallback,
  ResolveOpts,
  ResponseMode,
  SupportedVersion,
  VerifiablePresentationTypeFormat,
  VPTokenLocation,
} from '@sphereon/did-auth-siop'
import { VerifyCallback } from '@sphereon/wellknown-dids-client'

import { Resolvable } from 'did-resolver'
import { DIDDocument } from '@sphereon/did-uni-client'
import { EventEmitter } from 'events'
import { IKeyValueStore, IValueData } from '@veramo/kv-store'
import { IPresentationDefinition } from '@sphereon/pex'
import { RPInstance } from '../RPInstance'
import { PEVersion } from '@sphereon/pex/dist/main/lib/types'


export interface ISiopv2RelyingParty extends IPluginMethodMap {
  pexDefinitionGet(definitionId: string): Promise<IPresentationDefinition | undefined>

  pexDefinitionExists(definitionId: string): Promise<boolean>

  pexDefinitionPersist(args: IPEXDefinitionPersistArgs): Promise<IValueData<IPresentationDefinition>>

  pexDefinitionVersion(presentationDefinition: IPresentationDefinition): Promise<VersionDiscoveryResult>

  siopRPInstance(args: ISiopRPInstanceArgs, context: IRequiredContext): Promise<RPInstance>
}


export interface ISiopv2RPOpts {
  optionsStore?: IKeyValueStore<IRPOptions>
  definitionStore?: IKeyValueStore<IPresentationDefinition>
  defaultOpts?: IRPDefaultOpts
  instanceOpts?: IPEXInstanceOptions[]
}

export interface IRPDefaultOpts extends IRPOptions {
}


export interface IPEXDefinitionPersistArgs extends IPEXInstanceOptions {
  definition: IPresentationDefinition
  ttl?: number
}

export interface ISiopRPInstanceArgs {
  definitionId?: string
}

export interface IPEXInstanceOptions extends IPEXOptions {
  rpOpts?: IRPOptions
}

export interface IPEXOptions {
  presentationVerifyCallback?: PresentationVerificationCallback
  definition?: IPresentationDefinition
  definitionId: string
}

export interface PerDidResolver {
  didMethod: string
  resolver: Resolvable
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


export type IRequiredContext = IAgentContext<IDataStoreORM & IResolver & IDIDManager & IKeyManager & ICredentialIssuer & ICredentialVerifier>

export interface IRPOptions {
  responseMode?: ResponseMode
  supportedVersions?: SupportedVersion[]
  sessionManager?: IRPSessionManager
  expiresIn?: number
  eventEmitter?: EventEmitter
  didOpts: IDIDOptions
}

export interface IDIDOptions {
  resolveOpts?: ResolveOpts
  identifierOpts: IIdentifierOpts
  supportedDIDMethods?: string[]
  checkLinkedDomains?: CheckLinkedDomain
  wellknownDIDVerifyCallback?: VerifyCallback
}


export interface IIdentifierOpts {
  identifier: IIdentifier | string
  verificationMethodSection?: DIDDocumentSection
  kid?: string
}


export interface VersionDiscoveryResult {
  version?: PEVersion
  error?: string
}
