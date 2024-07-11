import { DIDDocument } from '@sphereon/did-uni-client'
import { GenericAuthArgs, ISingleEndpointOpts } from '@sphereon/ssi-express-support'
import { IAgentContext, IDataStoreORM, IDIDManager, IKeyManager, IResolver } from '@veramo/core'
import { VerificationMethod } from 'did-resolver'

export type IRequiredPlugins = IDataStoreORM & IDIDManager & IKeyManager & IResolver
export type IRequiredContext = IAgentContext<IRequiredPlugins>

export interface DidRegistrationCreateRequest {
  did?: string
  jobId: string
  options: DidRegistrationOptions
  secret: DidRegistrationSecret
  didDocument?: DIDDocument
}

export interface DidRegistrationUpdateRequest {
  did: string
  jobId: string
  options: DidRegistrationOptions
  secret: DidRegistrationSecret
  didDocumentOperation: DidDocumentOperation[]
  didDocument?: DIDDocument[]
}

export interface DidRegistrationDeactivateRequest {
  did: string
  jobId?: string
  options?: DidRegistrationOptions
  secret?: DidRegistrationSecret
}

export type DidDocumentOperation = 'setDidDocument' | 'addToDidDocument' | 'removeFromDidDocument' | string

export interface DidRegistrationOptions {
  network?: string
  storeSecrets?: boolean
  returnSecrets?: boolean

  [x: string]: any
}

export interface DidRegistrationSecret {
  seed?: string
  verificationMethod?: CreateVerificationMethod[]

  [x: string]: any
}

export interface CreateVerificationMethod extends VerificationMethod {
  privateKeyBase58?: string
  privateKeyBase64?: string
  privateKeyJwk?: JsonWebKey
  privateKeyHex?: string
  privateKeyMultibase?: string
  purpose?: ('authentication' | 'assertionMethod' | 'capabilityDelegation' | 'capabilityInvocation')[]
}

export interface CreateState {
  jobId: string
  didState: DidState
  didRegistrationMetadata?: Record<string, any>
  didDocumentMetadata?: Record<string, any>
}

export type DidStateValue = 'finished' | 'failed' | 'action' | 'wait' | 'exists'

export type DidStateAction = 'redirect' | 'getVerificationMethod' | 'signPayload' | 'decryptPayload'

export interface DidState {
  state: DidStateValue
  action?: DidStateAction
  wait?: string
  waitTime?: number
  did: string
  secret?: DidRegistrationSecret
  didDocument?: DIDDocument
}

export interface IDidWebServiceOpts {
  globalAuth?: GenericAuthArgs
  endpointOpts?: IGlobalDidWebEndpointOpts
  enableFeatures?: DidWebServiceFeatures[] // Feature to enable. If not defined or empty. Has to be defined or no features will be enabled
}

export interface IDidAPIOpts {
  endpointOpts?: IDidAPIEndpointOpts
  enableFeatures?: DidApiFeatures[] // Feature to enable. If not defined or empty, all features will be enabled
}

export interface IDidAPIEndpointOpts {
  basePath?: string
  globalAuth?: GenericAuthArgs
  createDid?: ICreateDidEndpointOpts
  resolveDid?: IResolveEndpointOpts
  deactivateDid?: ISingleEndpointOpts
  getDidMethods?: ISingleEndpointOpts
  // globalDidWebResolution?: IGlobalDidWebEndpointOpts
}

export interface IGlobalDidWebEndpointOpts extends ISingleEndpointOpts {
  hostname?: string
  disableWellKnown?: boolean
  disableSubPaths?: boolean
}

export interface ICreateDidEndpointOpts extends ISingleEndpointOpts {
  kms?: string
  storeSecrets?: boolean
  noErrorOnExistingDid?: boolean
  defaultMethod?: string
}

export interface IResolveEndpointOpts extends ISingleEndpointOpts {
  mode?: 'local' | 'hybrid' | 'global'
}

export type DidWebServiceFeatures = 'did-web-global-resolution'
export type DidApiFeatures = 'did-resolve' | 'did-persist'
