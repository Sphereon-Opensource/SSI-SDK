import { DIDDocument } from '@sphereon/did-uni-client'
import { GenericAuthArgs, ISingleEndpointOpts } from '@sphereon/ssi-sdk.express-support'
import { IAgentContext, IDataStore, IDataStoreORM, IDIDManager, IKeyManager, IResolver } from '@veramo/core'
import { ProofFormat } from '@veramo/core/src/types/ICredentialIssuer'
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
  didOpts?: IVCAPIIssueOpts
}

export interface IDidAPIEndpointOpts {
  basePath?: string
  globalAuth?: GenericAuthArgs
  createDid?: ISingleEndpointOpts
  resolveDid?: ISingleEndpointOpts
  deactivateDid?: ISingleEndpointOpts
  getDidMethods?: ISingleEndpointOpts
}

export enum IVCIApiFeatures {
  DID_RESOLVE = 'did-resolve',
  DID_PERSISTENCE = 'did-persist',
}

export interface IVCAPIIssueOpts {
  enableFeatures?: IVCIApiFeatures[] // Feature to enable. If not defined or empty, all features will be enabled
  persistIssuedCredentials?: boolean // Whether the issuer persists issued credentials or not. Defaults to VC_PERSISTENCE feature flag being present or not

  /**
   * The desired format for the VerifiablePresentation to be created.
   */
  proofFormat: ProofFormat

  /**
   * Remove payload members during JWT-JSON transformation. Defaults to `true`.
   * See https://www.w3.org/TR/vc-data-model/#jwt-encoding
   */
  removeOriginalFields?: boolean

  /**
   * [Optional] The ID of the key that should sign this credential.
   * If this is not specified, the first matching key will be used.
   */
  keyRef?: string

  /**
   * When dealing with JSON-LD you also MUST provide the proper contexts.
   * Set this to `true` ONLY if you want the `@context` URLs to be fetched in case they are not preloaded.
   * The context definitions SHOULD rather be provided at startup instead of being fetched.
   *
   * Defaults to `false`
   */
  fetchRemoteContexts?: boolean
}
