import { DIDDocument } from '@sphereon/did-uni-client'
import { GenericAuthArgs, ISingleEndpointOpts } from '@sphereon/ssi-sdk.express-support'
import { IAgentContext, IDataStore, IDataStoreORM, IDIDManager, IKeyManager, IResolver } from '@veramo/core'
import { VerificationMethod } from 'did-resolver'

export type IRequiredPlugins = IDataStore & IDataStoreORM & IDIDManager & IKeyManager & IResolver
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
  jobId: string
  options: DidRegistrationOptions
  secret: DidRegistrationSecret
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

export interface DidState {
  state: 'finished' | 'failed' | 'action' | 'wait'
  action?: 'redirect' | 'getVerificationMethod' | 'signPayload' | 'decryptPayload'
  wait?: string
  waitTime?: number
  did: string
  secret?: DidRegistrationSecret
  didDocument?: DIDDocument
}

export interface IDidAPIOpts {
  endpointOpts?: IDidAPIEndpointOpts
  enableFeatures?: didApiFeatures[] // Feature to enable. If not defined or empty, all features will be enabled
}

export interface IDidAPIEndpointOpts {
  basePath?: string
  globalAuth?: GenericAuthArgs
  createDid?: ISingleEndpointOpts
  resolveDid?: ISingleEndpointOpts
  deactivateDid?: ISingleEndpointOpts
  getDidMethods?: ISingleEndpointOpts
}

export type didApiFeatures = 'did-resolve' | 'did-persist'
