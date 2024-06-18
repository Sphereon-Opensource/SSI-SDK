import { OpenID4VCIClient, OpenID4VCIClientState } from '@sphereon/oid4vci-client'
import {
  AuthorizationRequestOpts,
  AuthorizationResponse,
  CredentialConfigurationSupported,
  CredentialResponse,
  EndpointMetadataResult,
  ExperimentalSubjectIssuance,
  NotificationRequest,
} from '@sphereon/oid4vci-common'
import { IContactManager } from '@sphereon/ssi-sdk.contact-manager'
import { IBasicCredentialLocaleBranding, IBasicIssuerLocaleBranding, Identity, Party } from '@sphereon/ssi-sdk.data-store'
import { IIssuanceBranding } from '@sphereon/ssi-sdk.issuance-branding'
import { IVerifiableCredential, WrappedVerifiableCredential, WrappedVerifiablePresentation } from '@sphereon/ssi-types'
import {
  IAgentContext,
  ICredentialIssuer,
  ICredentialVerifier,
  IDIDManager,
  IIdentifier,
  IKey,
  IKeyManager,
  IPluginMethodMap,
  IResolver,
  TKeyType,
  VerifiableCredential,
} from '@veramo/core'
import { IDataStore, IDataStoreORM } from '@veramo/data-store'
import { _ExtendedIKey } from '@veramo/utils'
import { JWTHeader, JWTPayload } from 'did-jwt'
import { BaseActionObject, Interpreter, ResolveTypegenMeta, ServiceMap, State, StateMachine, TypegenDisabled } from 'xstate'

export interface IOID4VCIHolder extends IPluginMethodMap {
  oid4vciHolderGetMachineInterpreter(args: GetMachineArgs, context: RequiredContext): Promise<OID4VCIMachine>
  oid4vciHolderGetInitiationData(args: InitiateOID4VCIArgs, context: RequiredContext): Promise<InitiationData>
  oid4vciHolderCreateCredentialSelection(args: CreateCredentialSelectionArgs, context: RequiredContext): Promise<Array<CredentialTypeSelection>>
  oid4vciHolderGetContact(args: GetContactArgs, context: RequiredContext): Promise<Party | undefined>
  oid4vciHolderGetCredentials(args: GetCredentialsArgs, context: RequiredContext): Promise<Array<MappedCredentialToAccept>>
  oid4vciHolderGetCredential(args: GetCredentialArgs, context: RequiredContext): Promise<MappedCredentialToAccept>
  oid4vciHolderAddContactIdentity(args: AddContactIdentityArgs, context: RequiredContext): Promise<Identity>
  oid4vciHolderAssertValidCredentials(args: AssertValidCredentialsArgs, context: RequiredContext): Promise<void>
  oid4vciHolderStoreCredentialBranding(args: StoreCredentialBrandingArgs, context: RequiredContext): Promise<void>
  oid4vciHolderStoreCredentials(args: StoreCredentialsArgs, context: RequiredContext): Promise<void>
}

export type OID4VCIHolderOptions = {
  onContactIdentityCreated?: (args: OnContactIdentityCreatedArgs) => Promise<void>
  onCredentialStored?: (args: OnCredentialStoredArgs) => Promise<void>
  onIdentifierCreated?: (args: OnIdentifierCreatedArgs) => Promise<void>
  vcFormatPreferences?: Array<string>
  jsonldCryptographicSuitePreferences?: Array<string>
  defaultAuthorizationRequestOptions?: AuthorizationRequestOpts
  didMethodPreferences?: Array<SupportedDidMethodEnum>
  jwtCryptographicSuitePreferences?: Array<SignatureAlgorithmEnum>
}

export type OnContactIdentityCreatedArgs = {
  contactId: string
  identity: Identity
}

export type OnCredentialStoredArgs = {
  vcHash: string
  credential: VerifiableCredential
}

export type OnIdentifierCreatedArgs = {
  identifier: IIdentifier
}

export type GetMachineArgs = {
  requestData: RequestData
  authorizationRequestOpts?: AuthorizationRequestOpts
  stateNavigationListener?: (oid4vciMachine: OID4VCIMachineInterpreter, state: OID4VCIMachineState, navigation?: any) => Promise<void>
}

export type InitiateOID4VCIArgs = Pick<OID4VCIMachineContext, 'requestData' | 'authorizationRequestOpts'>
export type CreateCredentialSelectionArgs = Pick<
  OID4VCIMachineContext,
  'credentialsSupported' | 'credentialBranding' | 'selectedCredentials' | 'locale' | 'openID4VCIClientState'
>
export type GetContactArgs = Pick<OID4VCIMachineContext, 'serverMetadata'>
export type GetCredentialsArgs = Pick<OID4VCIMachineContext, 'verificationCode' | 'openID4VCIClientState'>
export type AddContactIdentityArgs = Pick<OID4VCIMachineContext, 'credentialsToAccept' | 'contact'>
export type AssertValidCredentialsArgs = Pick<OID4VCIMachineContext, 'credentialsToAccept'>
export type StoreCredentialBrandingArgs = Pick<
  OID4VCIMachineContext,
  'serverMetadata' | 'credentialBranding' | 'selectedCredentials' | 'credentialsToAccept'
>
export type StoreCredentialsArgs = Pick<
  OID4VCIMachineContext,
  'credentialsToAccept' | 'serverMetadata' | 'credentialsSupported' | 'openID4VCIClientState'
>
export type SendNotificationArgs = Pick<
  OID4VCIMachineContext,
  'credentialsToAccept' | 'serverMetadata' | 'credentialsSupported' | 'openID4VCIClientState'
> & { notificationRequest?: NotificationRequest; stored: boolean }

export enum OID4VCIHolderEvent {
  CONTACT_IDENTITY_CREATED = 'contact_identity_created',
  CREDENTIAL_STORED = 'credential_stored',
  IDENTIFIER_CREATED = 'identifier_created',
}

export type RequestData = {
  credentialOffer?: any
  code?: string
  uri: string
  [x: string]: any
}

export enum SupportedLanguage {
  ENGLISH = 'en',
  DUTCH = 'nl',
}

export type VerifyCredentialToAcceptArgs = {
  mappedCredential: MappedCredentialToAccept
  context: RequiredContext
}

export type MappedCredentialToAccept = ExperimentalSubjectIssuance & {
  correlationId: string
  credential: CredentialToAccept
  uniformVerifiableCredential: IVerifiableCredential
  rawVerifiableCredential: VerifiableCredential
}

export type OID4VCIMachineContext = {
  authorizationRequestOpts?: AuthorizationRequestOpts
  requestData?: RequestData // TODO WAL-673 fix type as this is not always a qr code (deeplink)
  locale?: string
  authorizationCodeURL?: string
  credentialBranding?: Record<string, Array<IBasicCredentialLocaleBranding>>
  credentialsSupported: Record<string, CredentialConfigurationSupported>
  serverMetadata?: EndpointMetadataResult
  openID4VCIClientState?: OpenID4VCIClientState
  credentialSelection: Array<CredentialTypeSelection>
  contactAlias: string
  contact?: Party
  selectedCredentials: Array<string>
  credentialsToAccept: Array<MappedCredentialToAccept>
  verificationCode?: string // TODO WAL-672 refactor to not store verificationCode in the context
  hasContactConsent: boolean
  error?: ErrorDetails
}

export enum OID4VCIMachineStates {
  initiateOID4VCI = 'initiateOID4VCI',
  createCredentialSelection = 'createCredentialSelection',
  getContact = 'getContact',
  transitionFromSetup = 'transitionFromSetup',
  addContact = 'addContact',
  transitionFromContactSetup = 'transitionFromContactSetup',
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

export type OID4VCIMachineState = State<OID4VCIMachineContext, OID4VCIMachineEventTypes, any, { value: any; context: OID4VCIMachineContext }, any>

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
  stateDefinition?: OID4VCIMachineState
}

export type OID4VCIMachineInstanceOpts = {
  services?: any
  guards?: any
  subscription?: () => void
  requireCustomNavigationHook?: boolean
  authorizationRequestOpts?: AuthorizationRequestOpts
  stateNavigationListener: (oid4vciMachine: OID4VCIMachineInterpreter, state: OID4VCIMachineState, navigation?: any) => Promise<void>
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
  selectCredentialGuard = 'oid4vciSelectCredentialsGuard',
  requirePinGuard = 'oid4vciRequirePinGuard',
  requireAuthorizationGuard = 'oid4vciRequireAuthorizationGuard',
  noAuthorizationGuard = 'oid4vciNoAuthorizationGuard',
  hasAuthorizationResponse = 'oid4vciHasAuthorizationResponse',
  hasNoContactIdentityGuard = 'oid4vciHasNoContactIdentityGuard',
  verificationCodeGuard = 'oid4vciVerificationCodeGuard',
  createContactGuard = 'oid4vciCreateContactGuard',
  hasSelectedCredentialsGuard = 'oid4vciHasSelectedCredentialsGuard',
}

export enum OID4VCIMachineServices {
  initiateOID4VCI = 'initiateOID4VCI',
  getContact = 'getContact',
  addContactIdentity = 'addContactIdentity',
  createCredentialSelection = 'createCredentialSelection',
  getCredentials = 'getCredentials',
  assertValidCredentials = 'assertValidCredentials',
  storeCredentialBranding = 'storeCredentialBranding',
  sendNotification = 'sendNotification',
  storeCredentials = 'storeCredentials',
}

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
}

export enum RequestType {
  OPENID_INITIATE_ISSUANCE = 'openid-initiate-issuance',
  OPENID_CREDENTIAL_OFFER = 'openid-credential-offer',
  HTTPS = 'https',
  HTTP = 'http',
}

export type CredentialTypeSelection = ExperimentalSubjectIssuance & {
  id: string
  credentialType: string
  credentialAlias: string
  isSelected: boolean
}

export type OID4VCIMachine = {
  interpreter: OID4VCIMachineInterpreter
}

export type InitiationData = {
  authorizationCodeURL?: string
  credentialBranding?: Record<string, Array<IBasicCredentialLocaleBranding>>
  credentialsSupported: Record<string, CredentialConfigurationSupported>
  serverMetadata: EndpointMetadataResult
  openID4VCIClientState: OpenID4VCIClientState
}

export type SelectAppLocaleBrandingArgs = {
  locale?: string
  localeBranding?: Array<IBasicCredentialLocaleBranding | IBasicIssuerLocaleBranding>
}

export type IssuanceOpts = CredentialConfigurationSupported & {
  credentialConfigurationId?: string // Explicit ID for a credential
  didMethod: SupportedDidMethodEnum
  keyType: TKeyType
  codecName?: string
  kid?: string
  identifier: IIdentifier
}

export enum SupportedDidMethodEnum {
  DID_ETHR = 'ethr',
  DID_KEY = 'key',
  DID_LTO = 'lto',
  DID_ION = 'ion',
  DID_FACTOM = 'factom',
  DID_JWK = 'jwk',
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
  issuanceOpt: IssuanceOpts
  credentialResponse: CredentialResponse
}

export type GetCredentialConfigsSupportedArgs = {
  client: OpenID4VCIClient
  vcFormatPreferences: Array<string>
}

export type GetCredentialBrandingArgs = {
  credentialsSupported: Record<string, CredentialConfigurationSupported>
  context: RequiredContext
}

export type GetPreferredCredentialFormatsArgs = {
  credentials: Record<string, CredentialConfigurationSupported>
  vcFormatPreferences: Array<string>
}

export type MapCredentialToAcceptArgs = {
  credential: CredentialToAccept
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
  identifier: IIdentifier
  context: RequiredContext
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
  kms?: KeyManagementSystemEnum
  alias?: string
  options?: IdentifierProviderOpts
}

export type GetIssuanceOptsArgs = {
  client: OpenID4VCIClient
  credentialsSupported: Record<string, CredentialConfigurationSupported>
  serverMetadata: EndpointMetadataResult
  context: RequiredContext
  didMethodPreferences: Array<SupportedDidMethodEnum>
  jwtCryptographicSuitePreferences: Array<SignatureAlgorithmEnum>
  jsonldCryptographicSuitePreferences: Array<string>
}

export type GetIssuanceDidMethodArgs = {
  credentialSupported: CredentialConfigurationSupported
  client: OpenID4VCIClient
  didMethodPreferences: Array<SupportedDidMethodEnum>
}

export type GetIssuanceCryptoSuiteArgs = {
  credentialSupported: CredentialConfigurationSupported
  client: OpenID4VCIClient
  jwtCryptographicSuitePreferences: Array<SignatureAlgorithmEnum>
  jsonldCryptographicSuitePreferences: Array<string>
}

export type SignatureAlgorithmFromKeyArgs = {
  key: IKey
}

export type SignatureAlgorithmFromKeyTypeArgs = {
  type: TKeyType
}

export type KeyTypeFromCryptographicSuiteArgs = {
  suite: string
}

export type SignJwtArgs = {
  identifier: IIdentifier
  header: Partial<JWTHeader>
  payload: Partial<JWTPayload>
  options: { issuer: string; expiresIn?: number; canonicalize?: boolean }
  context: RequiredContext
}

export type GetSignerArgs = {
  identifier: IIdentifier
  context: RequiredContext
}

export type GetCredentialArgs = {
  pin?: string
  issuanceOpt: IssuanceOpts
  client: OpenID4VCIClient
}

export enum SignatureAlgorithmEnum {
  EdDSA = 'EdDSA',
  ES256 = 'ES256',
  ES256K = 'ES256K',
}

export enum IdentifierAliasEnum {
  PRIMARY = 'primary',
}

export type CreateOrGetIdentifierOpts = {
  method: SupportedDidMethodEnum
  createOpts?: CreateIdentifierCreateOpts
}

export type IdentifierProviderOpts = {
  type?: TKeyType
  use?: string
  [x: string]: any
}

export enum KeyManagementSystemEnum {
  LOCAL = 'local',
}

export type IdentifierOpts = {
  identifier: IIdentifier
  key: _ExtendedIKey
  kid: string
}

export type RequiredContext = IAgentContext<
  IIssuanceBranding | IContactManager | ICredentialVerifier | ICredentialIssuer | IDataStore | IDataStoreORM | IDIDManager | IResolver | IKeyManager
>
