import { OpenID4VCIClient, OpenID4VCIClientState } from '@sphereon/oid4vci-client'
import { AuthorizationResponse, CredentialResponse, CredentialSupported, EndpointMetadataResult } from '@sphereon/oid4vci-common'
import { IContactManager } from '@sphereon/ssi-sdk.contact-manager'
import { IBasicCredentialLocaleBranding, IBasicIssuerLocaleBranding, Identity, Party } from '@sphereon/ssi-sdk.data-store'
import { IIssuanceBranding } from '@sphereon/ssi-sdk.issuance-branding'
import { IVerifiableCredential, WrappedVerifiableCredential, WrappedVerifiablePresentation } from '@sphereon/ssi-types'
import { IAgentContext, ICredentialPlugin, IPluginMethodMap, TKeyType, VerifiableCredential } from '@veramo/core'
import { IDataStore, IDataStoreORM } from '@veramo/data-store'
import { BaseActionObject, Interpreter, ResolveTypegenMeta, ServiceMap, State, StateMachine, TypegenDisabled } from 'xstate'

export interface IOID4VCIHolder extends IPluginMethodMap {
  oid4vciHolderGetMachineInterpreter(args: GetMachineArgs, context: RequiredContext): Promise<OID4VCIMachine>
  oid4vciHolderGetInitiationData(args: InitiateOID4VCIArgs, context: RequiredContext): Promise<InitiationData>
  oid4vciHolderCreateCredentialSelection(args: CreateCredentialSelectionArgs, context: RequiredContext): Promise<Array<CredentialTypeSelection>>
  oid4vciHolderGetContact(args: GetContactArgs, context: RequiredContext): Promise<Party | undefined>
  oid4vciHolderGetCredentials(args: GetCredentialsArgs, context: RequiredContext): Promise<Array<MappedCredentialToAccept> | undefined>
  oid4vciHolderAddContactIdentity(args: AddContactIdentityArgs, context: RequiredContext): Promise<Identity>
  oid4vciHolderAssertValidCredentials(args: AssertValidCredentialsArgs, context: RequiredContext): Promise<void>
  oid4vciHolderStoreCredentialBranding(args: StoreCredentialBrandingArgs, context: RequiredContext): Promise<void>
  oid4vciHolderStoreCredentials(args: StoreCredentialsArgs, context: RequiredContext): Promise<void>
}

export type OID4VCIHolderOptions = {
  onContactIdentityCreated?: (args: OnContactIdentityCreatedArgs) => Promise<void>
  onCredentialStored?: (args: OnCredentialStoredArgs) => Promise<void>
  onGetCredentials: (args: OnGetCredentialsArgs) => Promise<Array<CredentialToAccept>>
  vcFormatPreferences?: Array<string>
}

export type OnContactIdentityCreatedArgs = {
  contactId: string
  identity: Identity
}

export type OnCredentialStoredArgs = {
  vcHash: string
  credential: VerifiableCredential
}

export type GetMachineArgs = {
  requestData: RequestData
  stateNavigationListener?: (oid4vciMachine: OID4VCIMachineInterpreter, state: OID4VCIMachineState, navigation?: any) => Promise<void>
}

export type InitiateOID4VCIArgs = Pick<OID4VCIMachineContext, 'requestData'>
export type CreateCredentialSelectionArgs = Pick<
  OID4VCIMachineContext,
  'credentialsSupported' | 'credentialBranding' | 'selectedCredentials' | 'locale'
>
export type GetContactArgs = Pick<OID4VCIMachineContext, 'serverMetadata'>
export type GetCredentialsArgs = Pick<OID4VCIMachineContext, 'verificationCode' | 'selectedCredentials' | 'openID4VCIClientState'>
export type AddContactIdentityArgs = Pick<OID4VCIMachineContext, 'credentialsToAccept' | 'contact'>
export type AssertValidCredentialsArgs = Pick<OID4VCIMachineContext, 'credentialsToAccept'>
export type StoreCredentialBrandingArgs = Pick<
  OID4VCIMachineContext,
  'serverMetadata' | 'credentialBranding' | 'selectedCredentials' | 'credentialsToAccept'
>
export type StoreCredentialsArgs = Pick<OID4VCIMachineContext, 'credentialsToAccept'>

export enum OID4VCIHolderEvent {
  CONTACT_IDENTITY_CREATED = 'contact_identity_created',
  CREDENTIAL_STORED = 'credential_stored',
}

export type RequestData = {
  credentialOffer: any
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

export type MappedCredentialToAccept = {
  correlationId: string
  credential: CredentialToAccept
  uniformVerifiableCredential: IVerifiableCredential
  rawVerifiableCredential: VerifiableCredential
}

export type OID4VCIMachineContext = {
  requestData?: RequestData // TODO WAL-673 fix type as this is not always a qr code (deeplink)
  locale?: string
  authorizationCodeURL?: string
  credentialBranding?: Map<string, Array<IBasicCredentialLocaleBranding>>
  credentialsSupported: Array<CredentialSupported>
  serverMetadata?: EndpointMetadataResult
  openID4VCIClientState?: OpenID4VCIClientState
  credentialSelection: Array<CredentialTypeSelection>
  contactAlias: string
  contact?: Party
  selectedCredentials: Array<string>
  authorizationCodeResponse?: AuthorizationResponse
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
  // statePersistence?: MachineStatePersistenceOpts
}

export type OID4VCIMachineInstanceOpts = {
  services?: any
  guards?: any
  subscription?: () => void
  requireCustomNavigationHook?: boolean
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
}

export type CredentialTypeSelection = {
  id: string
  credentialType: string
  credentialAlias: string
  isSelected: boolean
}

export type OID4VCIMachine = {
  // machineStateInit?: MachineStateInit
  interpreter: OID4VCIMachineInterpreter
}

export type InitiationData = {
  authorizationCodeURL?: string
  credentialBranding: Map<string, Array<IBasicCredentialLocaleBranding>>
  credentialsSupported: Array<CredentialSupported>
  serverMetadata: EndpointMetadataResult
  openID4VCIClientState: OpenID4VCIClientState
}

export type SelectAppLocaleBrandingArgs = {
  locale?: string
  localeBranding?: Array<IBasicCredentialLocaleBranding | IBasicIssuerLocaleBranding>
}

export interface OnGetCredentialsArgs {
  pin?: string
  credentials?: Array<string>
  openID4VCIClientState: OpenID4VCIClientState
}

export type IssuanceOpts = CredentialSupported & {
  didMethod: SupportedDidMethodEnum
  keyType: TKeyType
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

export type GetSupportedCredentialsArgs = {
  openID4VCIClient: OpenID4VCIClient
  vcFormatPreferences: Array<string>
}

export type GetCredentialBrandingArgs = {
  credentialsSupported: Array<CredentialSupported>
  context: RequiredContext
}

export type GetPreferredCredentialFormatsArgs = {
  credentials: Array<CredentialSupported>
  vcFormatPreferences: Array<string>
}

export type MapCredentialToAcceptArgs = {
  credentials: Array<CredentialToAccept>
}

export type RequiredContext = IAgentContext<IIssuanceBranding | IContactManager | ICredentialPlugin | IDataStore | IDataStoreORM>
