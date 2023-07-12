import {
  IAgentContext,
  ICredentialIssuer,
  ICredentialPlugin,
  ICredentialVerifier,
  IDataStore,
  IDataStoreORM,
  IDIDManager,
  IKeyManager,
  IResolver,
} from '@veramo/core'
import { IPresentationExchange } from '@sphereon/ssi-sdk.presentation-exchange'
import { ProofFormat } from '@veramo/core/src/types/ICredentialIssuer'

export type IRequiredPlugins = IDataStore &
  IDataStoreORM &
  IDIDManager &
  IKeyManager &
  ICredentialIssuer &
  ICredentialVerifier &
  IPresentationExchange &
  ICredentialPlugin &
  IResolver
export type IRequiredContext = IAgentContext<IRequiredPlugins>

export interface IVCAPIOpts {
  pathOpts?: IVCAPIPathOpts
  issueCredentialOpts?: IVCAPIIssueOpts

  serverOpts?: IServerOpts
}

export interface IServerOpts {
  port?: number // The port to listen on
  cookieSigningKey?: string
  hostname?: string // defaults to "0.0.0.0", meaning it will listen on all IP addresses. Can be an IP address or hostname
}

export interface IVCAPIPathOpts {
  basePath?: string
  issueCredentialPath?: string
  getCredentialsPath?: string
  getCredentialPath?: string
  deleteCredentialPath?: string
  verifyCredentialPath?: string
  verifyPresentationPath?: string
}

export interface IVCAPIIssueOpts {
  persistIssuedCredentials?: boolean // Whether the issuer persists issued credentials or not. Defaults to true

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

export interface IIssueOptionsPayload {
  created?: string
  challenge?: string
  domain?: string
  credentialStatus?: {
    type: string
  }
}

export interface ChallengeOptsPayload {
  challenge?: string
  domain?: string
}
