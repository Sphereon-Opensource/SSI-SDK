import { OpenID4VCIClient, OpenID4VCIClientState } from '@sphereon/oid4vci-client'
import {
  AuthorizationRequestOpts,
  AuthorizationResponse,
  AuthorizationServerClientOpts,
  AuthzFlowType,
  CredentialConfigurationSupported,
  CredentialOfferRequestWithBaseUrl,
  CredentialResponse,
  CredentialsSupportedDisplay,
  EndpointMetadataResult,
  ExperimentalSubjectIssuance,
  IssuerCredentialSubject,
  MetadataDisplay,
  NotificationRequest,
} from '@sphereon/oid4vci-common'
import { DynamicRegistrationClientMetadata } from '@sphereon/oid4vc-common'
import { CreateOrGetIdentifierOpts, IdentifierProviderOpts, SupportedDidMethodEnum } from '@sphereon/ssi-sdk-ext.did-utils'
import {
  IIdentifierResolution,
  ManagedIdentifierMethod,
  ManagedIdentifierOptsOrResult,
  ManagedIdentifierResult,
} from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { IJwtService } from '@sphereon/ssi-sdk-ext.jwt-service'
import { IContactManager } from '@sphereon/ssi-sdk.contact-manager'
import { ICredentialStore } from '@sphereon/ssi-sdk.credential-store'
import {
  DigitalCredential,
  IBasicCredentialClaim,
  IBasicCredentialLocaleBranding,
  IBasicIssuerLocaleBranding,
  Identity,
  IIssuerLocaleBranding,
  Party,
} from '@sphereon/ssi-sdk.data-store'
import { IIssuanceBranding } from '@sphereon/ssi-sdk.issuance-branding'
import { ImDLMdoc } from '@sphereon/ssi-sdk.mdl-mdoc'
import { ISDJwtPlugin } from '@sphereon/ssi-sdk.sd-jwt'
import { ICredentialValidation, SchemaValidation } from '@sphereon/ssi-sdk.credential-validation'
import { IDidAuthSiopOpAuthenticator } from '@sphereon/ssi-sdk.siopv2-oid4vp-op-auth'
import {
  HasherSync,
  IVerifiableCredential,
  JoseSignatureAlgorithm,
  JoseSignatureAlgorithmString,
  OriginalVerifiableCredential,
  SdJwtClaimMetadata,
  SdJwtTypeDisplayMetadata,
  W3CVerifiableCredential,
  WrappedVerifiableCredential,
  WrappedVerifiablePresentation,
} from '@sphereon/ssi-types'
import {
  IAgentContext,
  ICredentialIssuer,
  ICredentialVerifier,
  IDIDManager,
  IKeyManager,
  IPluginMethodMap,
  IResolver,
  TAgent,
  TKeyType,
  VerificationPolicies,
} from '@veramo/core'
import { BaseActionObject, Interpreter, ResolveTypegenMeta, ServiceMap, State, StateMachine, TypegenDisabled } from 'xstate'
import { FirstPartyMachineStateNavigationListener } from './FirstPartyMachine'

export interface IOID4VCIHolder extends IPluginMethodMap {
  oid4vciHolderGetIssuerMetadata(args: GetIssuerMetadataArgs, context: RequiredContext): Promise<EndpointMetadataResult>

  oid4vciHolderGetMachineInterpreter(args: GetMachineArgs, context: RequiredContext): Promise<OID4VCIMachine> // FIXME is using GetMachineArgs as args but the function uses OID4VCIMachineInstanceOpts

  oid4vciHolderStart(args: PrepareStartArgs, context: RequiredContext): Promise<StartResult>

  oid4vciHolderCreateCredentialsToSelectFrom(
    args: CreateCredentialsToSelectFromArgs,
    context: RequiredContext,
  ): Promise<Array<CredentialToSelectFromResult>>

  oid4vciHolderGetContact(args: GetContactArgs, context: RequiredContext): Promise<Party | undefined>

  oid4vciHolderGetCredentials(args: GetCredentialsArgs, context: RequiredContext): Promise<Array<MappedCredentialToAccept>>

  oid4vciHolderGetCredential(args: GetCredentialArgs, context: RequiredContext): Promise<MappedCredentialToAccept>

  oid4vciHolderAddContactIdentity(args: AddContactIdentityArgs, context: RequiredContext): Promise<Identity>

  oid4vciHolderAssertValidCredentials(args: AssertValidCredentialsArgs, context: RequiredContext): Promise<Array<VerificationResult>>

  oid4vciHolderGetIssuerBranding(
    args: GetIssuerBrandingArgs,
    context: RequiredContext,
  ): Promise<Array<IIssuerLocaleBranding | IBasicIssuerLocaleBranding>>

  oid4vciHolderStoreIssuerBranding(args: StoreIssuerBrandingArgs, context: RequiredContext): Promise<void>

  oid4vciHolderStoreCredentialBranding(args: StoreCredentialBrandingArgs, context: RequiredContext): Promise<void>

  oid4vciHolderStoreCredentials(args: StoreCredentialsArgs, context: RequiredContext): Promise<void>
}

export type OID4VCIHolderOptions = {
  onContactIdentityCreated?: (args: OnContactIdentityCreatedArgs) => Promise<void>
  onCredentialStored?: (args: OnCredentialStoredArgs) => Promise<void>
  onIdentifierCreated?: (args: OnIdentifierCreatedArgs) => Promise<void>
  onVerifyEBSICredentialIssuer?: (args: VerifyEBSICredentialIssuerArgs) => Promise<VerifyEBSICredentialIssuerResult>
  vcFormatPreferences?: Array<string>
  jsonldCryptographicSuitePreferences?: Array<string>
  defaultAuthorizationRequestOptions?: AuthorizationRequestOpts
  didMethodPreferences?: Array<SupportedDidMethodEnum>
  jwtCryptographicSuitePreferences?: Array<JoseSignatureAlgorithm | JoseSignatureAlgorithmString>
  hasher?: HasherSync
}

export type OnContactIdentityCreatedArgs = {
  contactId: string
  identity: Identity
}

export type GetIssuerMetadataArgs = {
  issuer: string
  errorOnNotFound?: boolean
}

export type OnCredentialStoredArgs = {
  credential: DigitalCredential
  vcHash: string
}

export type OnIdentifierCreatedArgs = {
  identifier: ManagedIdentifierResult
}

export type GetMachineArgs = {
  requestData: RequestData
  trustAnchors?: Array<string>
  authorizationRequestOpts?: AuthorizationRequestOpts
  clientOpts?: AuthorizationServerClientOpts
  didMethodPreferences?: Array<SupportedDidMethodEnum>
  issuanceOpt?: Partial<IssuanceOpts>
  stateNavigationListener?: OID4VCIMachineStateNavigationListener
  firstPartyStateNavigationListener?: FirstPartyMachineStateNavigationListener
}

export type PrepareStartArgs = Pick<
  OID4VCIMachineContext,
  'requestData' | 'authorizationRequestOpts' | 'didMethodPreferences' | 'issuanceOpt' | 'accessTokenOpts'
>
export type CreateCredentialsToSelectFromArgs = Pick<
  OID4VCIMachineContext,
  'credentialsSupported' | 'credentialBranding' | 'selectedCredentials' | 'locale' | 'openID4VCIClientState'
>
export type GetContactArgs = Pick<OID4VCIMachineContext, 'serverMetadata'>
export type GetCredentialsArgs = Pick<
  OID4VCIMachineContext,
  'verificationCode' | 'openID4VCIClientState' | 'selectedCredentials' | 'didMethodPreferences' | 'issuanceOpt' | 'accessTokenOpts'
>
export type AddContactIdentityArgs = Pick<OID4VCIMachineContext, 'credentialsToAccept' | 'contact'>
export type GetIssuerBrandingArgs = Pick<OID4VCIMachineContext, 'serverMetadata' | 'contact'>
export type StoreIssuerBrandingArgs = Pick<OID4VCIMachineContext, 'issuerBranding' | 'contact'>
export type AssertValidCredentialsArgs = Pick<OID4VCIMachineContext, 'credentialsToAccept' | 'issuanceOpt'>
export type StoreCredentialBrandingArgs = Pick<
  OID4VCIMachineContext,
  'serverMetadata' | 'credentialBranding' | 'selectedCredentials' | 'credentialsToAccept'
>
export type StoreCredentialsArgs = Pick<
  OID4VCIMachineContext,
  'credentialsToAccept' | 'serverMetadata' | 'credentialsSupported' | 'openID4VCIClientState' | 'selectedCredentials' | 'issuanceOpt'
>
export type SendNotificationArgs = Pick<
  OID4VCIMachineContext,
  'credentialsToAccept' | 'serverMetadata' | 'credentialsSupported' | 'openID4VCIClientState'
> & { notificationRequest?: NotificationRequest; stored: boolean }
export type GetFederationTrustArgs = Pick<OID4VCIMachineContext, 'requestData' | 'trustAnchors' | 'serverMetadata'>
export type StartFirstPartApplicationMachine = Pick<OID4VCIMachineContext, 'openID4VCIClientState' | 'contact'> & {
  stateNavigationListener?: FirstPartyMachineStateNavigationListener
}

export enum OID4VCIHolderEvent {
  CONTACT_IDENTITY_CREATED = 'contact_identity_created',
  CREDENTIAL_STORED = 'credential_stored',
  IDENTIFIER_CREATED = 'identifier_created',
}

export type RequestData = {
  credentialOffer?: CredentialOfferRequestWithBaseUrl // This object needs to be created/prepared with the OID4VCI credential offer client
  code?: string // Authorization code
  uri: string // Either a credential offer URI, or issuer URI. If a credential offer URI. If a credential offer URI it is suggested to include the credential offer, otherwise we try to detect it ourselves
  existingClientState?: string // Allows us to start with an existing client state. Meaning someone had a client instance before starting the flow
  createAuthorizationRequestURL?: boolean // Create or do not create an authorization request URL. The default is true
  flowType?: AuthzFlowType // Force a particular flow type if there is an option.
  [x: string]: any
}

export enum SupportedLanguage {
  ENGLISH = 'en',
  DUTCH = 'nl',
}

export type VerifyCredentialToAcceptArgs = {
  mappedCredential: MappedCredentialToAccept
  onVerifyEBSICredentialIssuer?: (args: VerifyEBSICredentialIssuerArgs) => Promise<VerifyEBSICredentialIssuerResult>
  hasher?: HasherSync
  schemaValidation?: SchemaValidation
  context: RequiredContext
}

export type MappedCredentialToAccept = ExperimentalSubjectIssuance & {
  correlationId: string
  types: string[]
  credentialToAccept: CredentialToAccept
  uniformVerifiableCredential: IVerifiableCredential
  rawVerifiableCredential: W3CVerifiableCredential
}

export type OID4VCIMachineContext = {
  authorizationRequestOpts?: AuthorizationRequestOpts
  accessTokenOpts?: AccessTokenOpts
  didMethodPreferences?: Array<SupportedDidMethodEnum>
  issuanceOpt?: IssuanceOpts
  trustAnchors: Array<string>
  requestData?: RequestData // TODO WAL-673 fix type as this is not always a qr code (deeplink)
  locale?: string
  authorizationCodeURL?: string
  issuerBranding?: Array<IIssuerLocaleBranding | IBasicIssuerLocaleBranding>
  credentialBranding?: Record<string, Array<IBasicCredentialLocaleBranding>>
  credentialsSupported: Record<string, CredentialConfigurationSupported>
  serverMetadata?: EndpointMetadataResult
  openID4VCIClientState?: OpenID4VCIClientState
  credentialToSelectFrom: Array<CredentialToSelectFromResult>
  contactAlias: string
  contact?: Party
  selectedCredentials: Array<string>
  credentialsToAccept: Array<MappedCredentialToAccept>
  verificationCode?: string // TODO WAL-672 refactor to not store verificationCode in the context
  hasContactConsent: boolean
  trustedAnchors?: Array<string>
  error?: ErrorDetails
}

export enum OID4VCIMachineStates {
  start = 'start',
  createCredentialsToSelectFrom = 'createCredentialsToSelectFrom',
  getContact = 'getContact',
  transitionFromSetup = 'transitionFromSetup',
  getFederationTrust = 'getFederationTrust',
  reviewContact = 'reviewContact',
  addContact = 'addContact',
  getIssuerBranding = 'getIssuerBranding',
  storeIssuerBranding = 'storeIssuerBranding',
  addIssuerBrandingAfterIdentity = 'addIssuerBrandingAfterIdentity',
  transitionFromContactSetup = 'transitionFromContactSetup',
  startFirstPartApplicationFlow = 'startFirstPartApplicationFlow',
  selectCredentials = 'selectCredentials',
  transitionFromSelectingCredentials = 'transitionFromSelectingCredentials',
  verifyPin = 'verifyPin',
  initiateAuthorizationRequest = 'initiateAuthorizationRequest',
  waitForAuthorizationResponse = 'waitForAuthorizationResponse',
  getCredentials = 'getCredentials',
  transitionFromWalletInput = 'transitionFromWalletInput',
  addContactIdentity = 'addContactIdentity',
  reviewCredentials = 'reviewCredentials',
  verifyCredentials = 'verifyCredentials',
  storeCredentialBranding = 'storeCredentialBranding',
  storeCredentials = 'storeCredentials',
  handleError = 'handleError',
  aborted = 'aborted',
  declined = 'declined',
  error = 'error',
  done = 'done',
}

export enum OID4VCIMachineAddContactStates {
  idle = 'idle',
  next = 'next',
}

export enum OID4VCIMachineVerifyPinStates {
  idle = 'idle',
  next = 'next',
}

export type OID4VCIMachineInterpreter = Interpreter<
  OID4VCIMachineContext,
  any,
  OID4VCIMachineEventTypes,
  { value: any; context: OID4VCIMachineContext },
  any
>

export type OID4VCIMachineState = State<
  OID4VCIMachineContext,
  OID4VCIMachineEventTypes,
  any,
  {
    value: any
    context: OID4VCIMachineContext
  },
  any
>

export type OID4VCIStateMachine = StateMachine<
  OID4VCIMachineContext,
  any,
  OID4VCIMachineEventTypes,
  { value: any; context: OID4VCIMachineContext },
  BaseActionObject,
  ServiceMap,
  ResolveTypegenMeta<TypegenDisabled, OID4VCIMachineEventTypes, BaseActionObject, ServiceMap>
>

export type CreateOID4VCIMachineOpts = {
  requestData: RequestData
  machineName?: string
  locale?: string
  trustAnchors?: Array<string>
  stateDefinition?: OID4VCIMachineState
  didMethodPreferences?: Array<SupportedDidMethodEnum>
  accessTokenOpts?: AccessTokenOpts
  issuanceOpt?: IssuanceOpts
}

export type OID4VCIMachineStateNavigationListener = (
  oid4vciMachine: OID4VCIMachineInterpreter,
  state: OID4VCIMachineState,
  navigation?: any,
) => Promise<void>

export type OID4VCIMachineInstanceOpts = {
  services?: any
  guards?: any
  subscription?: () => void
  requireCustomNavigationHook?: boolean
  authorizationRequestOpts?: AuthorizationRequestOpts
  didMethodPreferences?: Array<SupportedDidMethodEnum>
  issuanceOpt?: IssuanceOpts // restrict the issuance to these opts
  stateNavigationListener?: OID4VCIMachineStateNavigationListener
  firstPartyStateNavigationListener?: FirstPartyMachineStateNavigationListener
} & CreateOID4VCIMachineOpts

export type OID4VCIProviderProps = {
  children?: any
  customOID4VCIInstance?: OID4VCIMachineInterpreter
}

export type OID4VCIContext = {
  oid4vciInstance?: OID4VCIMachineInterpreter
}

export type OID4VCIMachineNavigationArgs = {
  oid4vciMachine: OID4VCIMachineInterpreter
  state: OID4VCIMachineState
  navigation: any
  onNext?: () => void
  onBack?: () => void
}

export enum OID4VCIMachineEvents {
  NEXT = 'NEXT',
  PREVIOUS = 'PREVIOUS',
  DECLINE = 'DECLINE',
  CREATE_CONTACT = 'CREATE_CONTACT',
  SET_VERIFICATION_CODE = 'SET_VERIFICATION_CODE',
  SET_CONTACT_ALIAS = 'SET_CONTACT_ALIAS',
  SET_CONTACT_CONSENT = 'SET_CONTACT_CONSENT',
  SET_SELECTED_CREDENTIALS = 'SET_SELECTED_CREDENTIALS',
  SET_AUTHORIZATION_CODE_URL = 'SET_AUTHORIZATION_CODE_URL',
  INVOKED_AUTHORIZATION_CODE_REQUEST = 'INVOKED_AUTHORIZATION_CODE_REQUEST',
  PROVIDE_AUTHORIZATION_CODE_RESPONSE = 'PROVIDE_AUTHORIZATION_CODE_RESPONSE',
}

export enum OID4VCIMachineGuards {
  hasContactGuard = 'oid4vciHasContactGuard',
  hasNoContactGuard = 'oid4vciHasNoContactGuard',
  credentialsToSelectRequiredGuard = 'oid4vciCredentialsToSelectRequiredGuard',
  requirePinGuard = 'oid4vciRequirePinGuard',
  requireAuthorizationGuard = 'oid4vciRequireAuthorizationGuard',
  noAuthorizationGuard = 'oid4vciNoAuthorizationGuard',
  hasAuthorizationResponse = 'oid4vciHasAuthorizationResponse',
  hasNoContactIdentityGuard = 'oid4vciHasNoContactIdentityGuard',
  verificationCodeGuard = 'oid4vciVerificationCodeGuard',
  createContactGuard = 'oid4vciCreateContactGuard',
  hasSelectedCredentialsGuard = 'oid4vciHasSelectedCredentialsGuard',
  isOIDFOriginGuard = 'oid4vciIsOIDFOriginGuard',
  contactHasLowTrustGuard = 'oid4vciContactHasLowTrustGuard',
  isFirstPartyApplication = 'oid4vciIsFirstPartyApplication',
}

export enum OID4VCIMachineServices {
  start = 'start',
  getContact = 'getContact',
  getFederationTrust = 'getFederationTrust',
  addContactIdentity = 'addContactIdentity',
  createCredentialsToSelectFrom = 'createCredentialsToSelectFrom',
  getIssuerBranding = 'getIssuerBranding',
  storeIssuerBranding = 'storeIssuerBranding',
  getCredentials = 'getCredentials',
  assertValidCredentials = 'assertValidCredentials',
  storeCredentialBranding = 'storeCredentialBranding',
  sendNotification = 'sendNotification',
  storeCredentials = 'storeCredentials',
  startFirstPartApplicationFlow = 'startFirstPartApplicationFlow',
}

export type OID4VCIMachineServiceDefinitions = Record<keyof typeof OID4VCIMachineServices, (...args: Array<any>) => any>

export type NextEvent = { type: OID4VCIMachineEvents.NEXT }
export type PreviousEvent = { type: OID4VCIMachineEvents.PREVIOUS }
export type DeclineEvent = { type: OID4VCIMachineEvents.DECLINE }
export type CreateContactEvent = { type: OID4VCIMachineEvents.CREATE_CONTACT; data: Party }
export type SelectCredentialsEvent = { type: OID4VCIMachineEvents.SET_SELECTED_CREDENTIALS; data: Array<string> }
export type VerificationCodeEvent = { type: OID4VCIMachineEvents.SET_VERIFICATION_CODE; data: string }
export type ContactConsentEvent = { type: OID4VCIMachineEvents.SET_CONTACT_CONSENT; data: boolean }
export type ContactAliasEvent = { type: OID4VCIMachineEvents.SET_CONTACT_ALIAS; data: string }
export type SetAuthorizationCodeURLEvent = { type: OID4VCIMachineEvents.SET_AUTHORIZATION_CODE_URL; data: string }
export type InvokeAuthorizationRequestEvent = { type: OID4VCIMachineEvents.INVOKED_AUTHORIZATION_CODE_REQUEST; data: string }
export type AuthorizationResponseEvent = { type: OID4VCIMachineEvents.PROVIDE_AUTHORIZATION_CODE_RESPONSE; data: string | AuthorizationResponse }

export type OID4VCIMachineEventTypes =
  | NextEvent
  | PreviousEvent
  | DeclineEvent
  | CreateContactEvent
  | SelectCredentialsEvent
  | VerificationCodeEvent
  | ContactConsentEvent
  | ContactAliasEvent
  | SetAuthorizationCodeURLEvent
  | InvokeAuthorizationRequestEvent
  | AuthorizationResponseEvent

export type ErrorDetails = {
  title: string
  message: string
  // TODO WAL-676 would be nice if we can bundle these details fields into a new type so that we can check on this field instead of the 2 separately
  detailsTitle?: string
  detailsMessage?: string
  stack?: string
}

export enum RequestType {
  OPENID_INITIATE_ISSUANCE = 'openid-initiate-issuance',
  OPENID_CREDENTIAL_OFFER = 'openid-credential-offer',
  URL = 'URL',
}

export type CredentialToSelectFromResult = ExperimentalSubjectIssuance & {
  id: string
  credentialId: string
  credentialTypes: Array<string>
  credentialAlias: string
  isSelected: boolean
}

export type OID4VCIMachine = {
  interpreter: OID4VCIMachineInterpreter
}

export type StartResult = {
  authorizationCodeURL?: string
  credentialBranding?: Record<string, Array<IBasicCredentialLocaleBranding>>
  credentialsSupported: Record<string, CredentialConfigurationSupported>
  serverMetadata: EndpointMetadataResult
  oid4vciClientState: OpenID4VCIClientState
}

export type SelectAppLocaleBrandingArgs = {
  locale?: string
  localeBranding?: Array<IBasicCredentialLocaleBranding | IBasicIssuerLocaleBranding>
}

export type IssuanceOpts = CredentialConfigurationSupported & {
  credentialConfigurationId?: string // Explicit ID for a credential
  supportedBindingMethods: ManagedIdentifierMethod[]
  supportedPreferredDidMethod?: SupportedDidMethodEnum
  schemaValidation?: SchemaValidation
  // todo: rename, now we have generic identifiers
  identifier?: ManagedIdentifierOptsOrResult
  // todo: replace by signature alg, so we can determine applicable key types instead of determining up front. Use proof_types_supported
  keyType?: TKeyType
  codecName?: string
  kms?: string
}

export type VerificationResult = {
  result: boolean
  source: WrappedVerifiableCredential | WrappedVerifiablePresentation
  subResults: Array<VerificationSubResult>
  error?: string | undefined
  errorDetails?: string
}

export type VerificationSubResult = {
  result: boolean
  error?: string
  errorDetails?: string
}

export type CredentialToAccept = {
  id?: string
  types: string[]
  issuanceOpt: IssuanceOpts
  credentialResponse: CredentialResponse
}

export type GetCredentialConfigsSupportedArgs = {
  client: OpenID4VCIClient
  vcFormatPreferences: Array<string>
  format?: Array<string>
  types?: Array<Array<string>>
  configurationIds?: Array<string>
}

/**
 * Please note that this method is restricting the results to one set of types or configurationId.
 * It can potentially return multiple results mainly because of different formats.
 */
export type GetCredentialConfigsSupportedBySingleTypeOrIdArgs = {
  client: OpenID4VCIClient
  vcFormatPreferences: Array<string>
  format?: string[]
  types?: string[]
  configurationId?: string
}

export type GetCredentialBrandingArgs = {
  credentialsSupported: Record<string, CredentialConfigurationSupported>
  context: RequiredContext
}

export type GetBasicIssuerLocaleBrandingArgs = {
  display: MetadataDisplay[]
  dynamicRegistrationClientMetadata?: DynamicRegistrationClientMetadataDisplay
  context: RequiredContext
}

export type GetPreferredCredentialFormatsArgs = {
  credentials: Record<string, CredentialConfigurationSupported>
  vcFormatPreferences: Array<string>
}

export type MapCredentialToAcceptArgs = {
  credentialToAccept: CredentialToAccept
  hasher?: HasherSync
}

export type GetDefaultIssuanceOptsArgs = {
  credentialSupported: CredentialConfigurationSupported
  opts: DefaultIssuanceOpts
  context: RequiredContext
}

export type DefaultIssuanceOpts = {
  client: OpenID4VCIClient
}

export type GetIdentifierArgs = {
  issuanceOpt: IssuanceOpts
  context: RequiredContext
}

export type GetAuthenticationKeyArgs = {
  identifier: ManagedIdentifierOptsOrResult
  offlineWhenNoDIDRegistered?: boolean
  noVerificationMethodFallback?: boolean
  context: IAgentContext<IResolver & IDIDManager & IKeyManager>
}

export type GetOrCreatePrimaryIdentifierArgs = {
  context: RequiredContext
  opts?: CreateOrGetIdentifierOpts
}

export type CreateIdentifierArgs = {
  context: RequiredContext
  opts?: CreateIdentifierOpts
}

export type CreateIdentifierOpts = {
  method: SupportedDidMethodEnum
  createOpts?: CreateIdentifierCreateOpts
}

export type CreateIdentifierCreateOpts = {
  kms?: string
  alias?: string
  options?: IdentifierProviderOpts
}

export type GetIssuanceOptsArgs = {
  client: OpenID4VCIClient
  credentialsSupported: Record<string, CredentialConfigurationSupported>
  serverMetadata: EndpointMetadataResult
  context: RequiredContext
  didMethodPreferences: Array<SupportedDidMethodEnum>
  jwtCryptographicSuitePreferences: Array<JoseSignatureAlgorithm | JoseSignatureAlgorithmString>
  jsonldCryptographicSuitePreferences: Array<string>
  forceIssuanceOpt?: IssuanceOpts
}

export type GetIssuanceDidMethodArgs = {
  credentialSupported: CredentialConfigurationSupported
  client: OpenID4VCIClient
  didMethodPreferences: Array<SupportedDidMethodEnum>
}

export type GetIssuanceCryptoSuiteArgs = {
  credentialSupported: CredentialConfigurationSupported
  client: OpenID4VCIClient
  jwtCryptographicSuitePreferences: Array<JoseSignatureAlgorithm | JoseSignatureAlgorithmString>
  jsonldCryptographicSuitePreferences: Array<string>
}

export type GetCredentialArgs = {
  pin?: string
  issuanceOpt: IssuanceOpts
  client: OpenID4VCIClient
  accessTokenOpts?: AccessTokenOpts
}

export type AccessTokenOpts = {
  additionalRequestParams?: Record<string, any>
  clientOpts?: AuthorizationServerClientOpts
}

export enum IdentifierAliasEnum {
  PRIMARY = 'primary',
}

export type CredentialVerificationError = {
  error?: string
  errorDetails?: string
}

export type VerifyMdocArgs = { credential: string }

export type VerifySDJWTCredentialArgs = { credential: string; hasher?: HasherSync }

export interface VerifyCredentialArgs {
  credential: OriginalVerifiableCredential
  fetchRemoteContexts?: boolean
  policies?: VerificationPolicies

  [x: string]: any
}

export type IssuerType = 'RootTAO' | 'TAO' | 'TI' | 'Revoked or Undefined'

export type VerifyEBSICredentialIssuerArgs = {
  wrappedVc: WrappedVerifiableCredential
  issuerType?: IssuerType[]
}

export type Attribute = {
  hash: string
  body: string
  issuerType: IssuerType
  tao: string
  rootTao: string
}

export type VerifyEBSICredentialIssuerResult = {
  did: string
  attributes: Attribute[]
}

export type Oid4vciCredentialLocaleBrandingFromArgs = {
  credentialDisplay: CredentialsSupportedDisplay
}

export type SdJwtCredentialLocaleBrandingFromArgs = {
  credentialDisplay: SdJwtTypeDisplayMetadata
}

export type SdJwtGetCredentialBrandingFromArgs = {
  credentialDisplay?: Array<SdJwtTypeDisplayMetadata>
  claimsMetadata?: Array<SdJwtClaimMetadata>
}

export type SdJwtCredentialClaimLocalesFromArgs = {
  claimsMetadata: Array<SdJwtClaimMetadata>
}

export type IssuerLocaleBrandingFromArgs = {
  issuerDisplay: MetadataDisplay
  dynamicRegistrationClientMetadata?: DynamicRegistrationClientMetadataDisplay
}

export type Oid4vciGetCredentialBrandingFromArgs = {
  credentialDisplay?: Array<CredentialsSupportedDisplay>
  issuerCredentialSubject?: IssuerCredentialSubject
}

export type Oid4vciCredentialDisplayLocalesFromArgs = {
  credentialDisplay: Array<CredentialsSupportedDisplay>
}

export type SdJwtCredentialDisplayLocalesFromArgs = {
  credentialDisplay: Array<SdJwtTypeDisplayMetadata>
}

export type Oid4vciIssuerCredentialSubjectLocalesFromArgs = {
  issuerCredentialSubject: IssuerCredentialSubject
}

export type Oid4vciCombineDisplayLocalesFromArgs = {
  credentialDisplayLocales?: Map<string, CredentialsSupportedDisplay>
  issuerCredentialSubjectLocales?: Map<string, Array<IBasicCredentialClaim>>
}

export type SdJwtCombineDisplayLocalesFromArgs = {
  credentialDisplayLocales?: Map<string, SdJwtTypeDisplayMetadata>
  claimsMetadata?: Map<string, Array<IBasicCredentialClaim>>
}

export type DynamicRegistrationClientMetadataDisplay = Pick<
  DynamicRegistrationClientMetadata,
  'client_name' | 'client_uri' | 'contacts' | 'tos_uri' | 'policy_uri' | 'logo_uri'
>

export type DidAgents = TAgent<IResolver & IDIDManager>

export type RequiredContext = IAgentContext<
  IIssuanceBranding &
    IContactManager &
    ICredentialValidation &
    ICredentialVerifier &
    ICredentialIssuer &
    ICredentialStore &
    IIdentifierResolution &
    IJwtService &
    IDIDManager &
    IResolver &
    IKeyManager &
    ISDJwtPlugin &
    ImDLMdoc &
    IDidAuthSiopOpAuthenticator
>
