import {
  AccessTokenRequest,
  AccessTokenResponse,
  ClientMetadata,
  CredentialConfigurationSupported,
  CredentialDataSupplierInput,
  CredentialIssuerMetadataOpts,
  CredentialOfferMode,
  CredentialOfferSession,
  CredentialRequest,
  CredentialResponse,
  Grant,
  JsonLdIssuerCredentialDefinition,
  QRCodeOpts,
  StatusListOpts,
} from '@sphereon/oid4vci-common'
import { CredentialDataSupplier, IssuerCorrelation } from '@sphereon/oid4vci-issuer'
import { IDIDOptions, ResolveOpts } from '@sphereon/ssi-sdk-ext.did-utils'
import { IIdentifierResolution, ManagedIdentifierOptsOrResult } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { IOID4VCIStore } from '@sphereon/ssi-sdk.oid4vci-issuer-store'
import { ICredential } from '@sphereon/ssi-types'
import { IAgentContext, ICredentialIssuer, IDIDManager, IKeyManager, IPluginMethodMap, IResolver } from '@veramo/core'
import { IssuerInstance } from '../IssuerInstance'
import { IJwtService } from '@sphereon/ssi-sdk-ext.jwt-service'

export type IssuerCredentialDefinition = JsonLdIssuerCredentialDefinition

export interface IOID4VCIIssuer extends IPluginMethodMap {
  oid4vciCreateOfferURI(createArgs: ICreateOfferArgs, context: IRequiredContext): Promise<ICreateCredentialOfferURIResult>
  oid4vciIssueCredential(issueArgs: IIssueCredentialArgs, context: IRequiredContext): Promise<CredentialResponse>
  oid4vciCreateAccessTokenResponse(accessTokenArgs: IAssertValidAccessTokenArgs, context: IRequiredContext): Promise<AccessTokenResponse>
  oid4vciGetInstance(args: IIssuerInstanceArgs, context: IRequiredContext): Promise<IssuerInstance>
}

export interface IOID4VCIIssuerOpts {
  defaultStoreId?: string
  defaultNamespace?: string
  resolveOpts?: ResolveOpts
  returnSessions?: boolean
}

export interface ICreateOfferArgs extends IIssuerInstanceArgs {
  grants?: Grant
  credentials?: Record<string, CredentialConfigurationSupported>
  credentialDefinition?: IssuerCredentialDefinition
  credentialOfferUri?: string
  credentialDataSupplierInput?: CredentialDataSupplierInput // Optional storage that can help the credential Data Supplier. For instance to store credential input data during offer creation, if no additional data can be supplied later on

  redirectUri?: string
  // auth_session?: string; Would be a nice extension to support, to allow external systems to determine what the auth_session value should be
  // @Deprecated use tx_code in the grant object
  correlationId?: string
  sessionLifeTimeInSec?: number
  qrCodeOpts?: QRCodeOpts
  client_id?: string
  statusListOpts?: Array<StatusListOpts>
  offerMode?: CredentialOfferMode
  baseUri?: string
  scheme?: string
  pinLength?: number
}

export interface IIssueCredentialArgs extends IIssuerInstanceArgs {
  credentialRequest: CredentialRequest
  issuerCorrelation: IssuerCorrelation
  credential?: ICredential
  credentialDataSupplier?: CredentialDataSupplier
  credentialDataSupplierInput?: CredentialDataSupplierInput
  newCNonce?: string
  cNonceExpiresIn?: number
  tokenExpiresIn?: number
  responseCNonce?: string
}

export interface IAssertValidAccessTokenArgs extends IIssuerInstanceArgs {
  request: AccessTokenRequest
  expirationDuration: number
}

export interface IIssuerInstanceArgs {
  credentialIssuer: string
  storeId?: string
  namespace?: string
}

export interface IIssuerInstanceOptions extends IMetadataOptions {
  issuerOpts?: IIssuerOptions
  metadataOpts?: CredentialIssuerMetadataOpts
}

export interface IIssuerOptions {
  asClientOpts?: ClientMetadata
  idOpts?: ManagedIdentifierOptsOrResult
  resolveOpts?: ResolveOpts
  /**
   * @deprecated: use idOpts
   */
  didOpts?: IDIDOptions
  userPinRequired?: boolean
  nonceEndpoint?: string
  cNonceExpiresIn?: number

  /**
   * Used in the callbacks for the first party flow
   */
  // FIXME SPRIND-151 we need to start supporting a map with a definition id per credential, we can use the credential offer session to check which credential is being issued and then look it up in this map
  presentationDefinitionId?: string
}

export interface IMetadataOptions {
  credentialIssuer: string //The Credential Issuer's identifier.
  storeId?: string
  storeNamespace?: string
}

export type ICreateCredentialOfferURIResult = {
  uri: string
  session?: CredentialOfferSession
  userPin?: string
  userPinLength?: number
}

export type IRequiredContext = IAgentContext<
  IIdentifierResolution & IDIDManager & IResolver & IKeyManager & ICredentialIssuer & IOID4VCIStore & IJwtService
>
