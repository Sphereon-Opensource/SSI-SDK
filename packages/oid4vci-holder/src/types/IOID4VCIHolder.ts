import {
  IAgentContext,
  ICredentialPlugin,
  IPluginMethodMap,
  TKeyType,
  VerifiableCredential
} from '@veramo/core'
import {IDataStore, IDataStoreORM} from '@veramo/data-store'
import {OpenID4VCIClientState} from '@sphereon/oid4vci-client'
import {
  AuthorizationResponse,
  CredentialResponse,
  CredentialSupported
} from '@sphereon/oid4vci-common'
import {
  IBasicCredentialLocaleBranding,
  IBasicIssuerLocaleBranding,
  Identity,
  Party
} from '@sphereon/ssi-sdk.data-store'
import {IIssuanceBranding} from '@sphereon/ssi-sdk.issuance-branding'
import {IContactManager} from '@sphereon/ssi-sdk.contact-manager'
import {
  IVerifiableCredential,
  WrappedVerifiableCredential,
  WrappedVerifiablePresentation
} from '@sphereon/ssi-types'
import {
  BaseActionObject,
  Interpreter,
  ResolveTypegenMeta,
  ServiceMap,
  State,
  StateMachine,
  TypegenDisabled
} from 'xstate'

export interface IOID4VCIHolder extends IPluginMethodMap {
  oid4vciHolderGetMachineInterpreter(args: GetMachineArgs, context: RequiredContext): Promise<Array<string>>
  oid4vciHolderGetInitiationData(args: InitiateDataArgs, context: RequiredContext): Promise<InitiationData>
  oid4vciHolderCreateCredentialSelection(args: CreateCredentialSelectionArgs, context: RequiredContext): Promise<Array<CredentialTypeSelection>>
  oid4vciHolderGetContact(args: RetrieveContactArgs, context: RequiredContext): Promise<Party | undefined> // TODO no undefined
  oid4vciHolderGetCredentials(args: RetrieveCredentialsArgs, context: RequiredContext): Promise<Array<MappedCredentialToAccept> | undefined> // TODO empty array
  oid4vciHolderAddContactIdentity(args: AddContactIdentityArgs, context: RequiredContext): Promise<Identity>
  oid4vciHolderAssertValidCredentials(args: AssertValidCredentialsArgs, context: RequiredContext): Promise<void> // TODO boolean
  oid4vciHolderStoreCredentialBranding(args: StoreCredentialBrandingArgs, context: RequiredContext): Promise<void> // TODO boolean
  oid4vciHolderStoreCredentials(args: StoreCredentialsArgs, context: RequiredContext): Promise<void> // TODO boolean
}

export type OID4VCIHolderOptions = {
  onContactIdentityCreated?: (identity: Identity) => Promise<void>
  onCredentialStored?: (credential: VerifiableCredential) => Promise<void>
  onGetCredentials: (args: GetCredentialsArgs) => Promise<Array<CredentialFromOffer>>
  vcFormatPreferences?: Array<string>
}

export type GetMachineArgs = {
  requestData: any // TODO
  navigation?: (oid4vciMachine: OID4VCIMachineInterpreter, state: OID4VCIMachineState, navigation?: any) => Promise<void> //NativeStackNavigationProp<any>
}

export type InitiateDataArgs = Pick<OID4VCIMachineContext, 'requestData'>
export type CreateCredentialSelectionArgs = Pick<OID4VCIMachineContext, 'credentialsSupported' | 'credentialBranding' | 'selectedCredentials' | 'locale'>
export type RetrieveContactArgs = Pick<OID4VCIMachineContext, 'serverMetadata'> // TODO  rename
export type RetrieveCredentialsArgs = Pick<OID4VCIMachineContext, 'verificationCode' | 'selectedCredentials' | 'openID4VCIClientState'> // TODO  rename
export type AddContactIdentityArgs = Pick<OID4VCIMachineContext, 'credentialsToAccept' | 'contact'>
export type AssertValidCredentialsArgs = Pick<OID4VCIMachineContext, 'credentialsToAccept'>
export type StoreCredentialBrandingArgs = Pick<OID4VCIMachineContext, 'serverMetadata' | 'credentialBranding' | 'selectedCredentials' | 'credentialsToAccept'>
export type StoreCredentialsArgs = Pick<OID4VCIMachineContext, 'credentialsToAccept'>

export enum OID4VCIHolderEvents {
  // TODO lowercase
  CONTACT_IDENTITY_CREATED = 'contact_identity_created',
  CREDENTIAL_STORED = 'credential_stored',
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
  correlationId: string;
  credential: any;//CredentialFromOffer;
  uniformVerifiableCredential: IVerifiableCredential;
  rawVerifiableCredential: VerifiableCredential;
};

export type OID4VCIMachineContext = {
  requestData?: QrData; // TODO WAL-673 fix type as this is not always a qr code (deeplink)
  locale?: string
  authorizationCodeURL?: string
  credentialBranding?: any // TODO MAP should be serializable // check optional
  credentialsSupported: Array<any> // TODO
  serverMetadata?: any // TODO
  openID4VCIClientState?: OpenID4VCIClientState
  credentialSelection: Array<CredentialTypeSelection>;
  contactAlias: string;
  contact?: Party;
  selectedCredentials: Array<string>;
  authorizationCodeResponse?: AuthorizationResponse;
  credentialsToAccept: Array<MappedCredentialToAccept>;
  // TODO WAL-672 refactor to not store verificationCode in the context
  verificationCode?: string;
  hasContactConsent: boolean;
  error?: ErrorDetails;
};

export enum OID4VCIMachineStates {
  initiateOID4VCIProvider = 'initiateOID4VCIProvider',
  createCredentialSelection = 'createCredentialSelection',
  retrieveContact = 'retrieveContact',
  transitionFromSetup = 'transitionFromSetup',
  addContact = 'addContact',
  transitionFromContactSetup = 'transitionFromContactSetup',
  selectCredentials = 'selectCredentials',
  transitionFromSelectingCredentials = 'transitionFromSelectingCredentials',
  verifyPin = 'verifyPin',
  initiateAuthorizationRequest = 'initiateAuthorizationRequest',
  waitForAuthorizationResponse = 'waitForAuthorizationResponse',
  retrieveCredentials = 'retrieveCredentials',
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
  {value: any; context: OID4VCIMachineContext},
  any
>;

export type OID4VCIMachineState = State<OID4VCIMachineContext, OID4VCIMachineEventTypes, any, {value: any; context: OID4VCIMachineContext}, any>;

export type OID4VCIStateMachine = StateMachine<
  OID4VCIMachineContext,
  any,
  OID4VCIMachineEventTypes,
  {value: any; context: OID4VCIMachineContext},
  BaseActionObject,
  ServiceMap,
  ResolveTypegenMeta<TypegenDisabled, OID4VCIMachineEventTypes, BaseActionObject, ServiceMap>
>;

export type CreateOID4VCIMachineOpts = {
  requestData: QrData
  machineId?: string
  locale?: string // TODO should be here?
  initiateData: (args: InitiateDataArgs) => Promise<InitiationData> // TODO testing
  createCredentialSelection: (args: CreateCredentialSelectionArgs) => Promise<Array<CredentialTypeSelection>> // TODO testing
  retrieveContact: (args: RetrieveContactArgs) => Promise<Party | undefined>
  retrieveCredentials: (args: RetrieveCredentialsArgs) => Promise<Array<MappedCredentialToAccept> | undefined>
  addContactIdentity: (args: AddContactIdentityArgs) => Promise<Identity>
  assertValidCredentials: (args: AssertValidCredentialsArgs) => Promise<void>
  storeCredentialBranding: (args: StoreCredentialBrandingArgs) => Promise<void>
  storeCredentials: (args: StoreCredentialsArgs) => Promise<void>
};

export type OID4VCIMachineInstanceOpts = {
  services?: any;
  guards?: any;
  subscription?: () => void;
  requireCustomNavigationHook?: boolean;
  navigation: (oid4vciMachine: OID4VCIMachineInterpreter, state: OID4VCIMachineState, navigation?: any) => Promise<void> //NativeStackNavigationProp<any>
} & CreateOID4VCIMachineOpts;

export type OID4VCIProviderProps = {
  children?: any;//ReactNode;
  customOID4VCIInstance?: OID4VCIMachineInterpreter;
};

export type OID4VCIContext = {
  oid4vciInstance?: OID4VCIMachineInterpreter;
};

export type OID4VCIMachineNavigationArgs = {
  oid4vciMachine: OID4VCIMachineInterpreter;
  state: OID4VCIMachineState;
  navigation: any;//NativeStackNavigationProp<any>;
  onNext?: () => void;
  onBack?: () => void;
};

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
  hasNoContactIdentityGuard = 'oid4vciHasNoContactIdentityGuard',
  verificationCodeGuard = 'oid4vciVerificationCodeGuard',
  createContactGuard = 'oid4vciCreateContactGuard',
  hasSelectedCredentialsGuard = 'oid4vciHasSelectedCredentialsGuard',
}

export enum OID4VCIMachineServices {
  initiate = 'initiate',
  retrieveContact = 'retrieveContact',
  addContactIdentity = 'addContactIdentity',
  createCredentialSelection = 'createCredentialSelection',
  retrieveCredentials = 'retrieveCredentials',
  assertValidCredentials = 'assertValidCredentials',
  storeCredentialBranding = 'storeCredentialBranding',
  storeCredentials = 'storeCredentials',
}

export type NextEvent = {type: OID4VCIMachineEvents.NEXT};
export type PreviousEvent = {type: OID4VCIMachineEvents.PREVIOUS};
export type DeclineEvent = {type: OID4VCIMachineEvents.DECLINE};
export type CreateContactEvent = {type: OID4VCIMachineEvents.CREATE_CONTACT; data: Party};
export type SelectCredentialsEvent = {type: OID4VCIMachineEvents.SET_SELECTED_CREDENTIALS; data: Array<string>};
export type VerificationCodeEvent = {type: OID4VCIMachineEvents.SET_VERIFICATION_CODE; data: string};
export type ContactConsentEvent = {type: OID4VCIMachineEvents.SET_CONTACT_CONSENT; data: boolean};
export type ContactAliasEvent = {type: OID4VCIMachineEvents.SET_CONTACT_ALIAS; data: string};
export type SetAuthorizationCodeURLEvent = {type: OID4VCIMachineEvents.SET_AUTHORIZATION_CODE_URL; data: string};
export type InvokeAuthorizationRequestEvent = {type: OID4VCIMachineEvents.INVOKED_AUTHORIZATION_CODE_REQUEST; data: string};
export type AuthorizationResponseEvent = {type: OID4VCIMachineEvents.PROVIDE_AUTHORIZATION_CODE_RESPONSE; data: string | AuthorizationResponse};
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
  | AuthorizationResponseEvent;

// TODO mobile wallet type
export type ErrorDetails = {
  title: string;
  message: string;
  // TODO WAL-676 would be nice if we can bundle these details fields into a new type so that we can check on this field instead of the 2 separately
  detailsTitle?: string;
  detailsMessage?: string;
};

// TODO mobile wallet type
// TODO rename and remove non iod4vci
export enum QrTypesEnum {
  AUTH = 'auth',
  SIOPV2 = 'siopv2',
  OPENID_VC = 'openid-vc',
  OPENID4VC = 'openid4vc',
  OPENID = 'openid',
  OPENID_INITIATE_ISSUANCE = 'openid-initiate-issuance',
  OPENID_CREDENTIAL_OFFER = 'openid-credential-offer',
}


// TODO mobile wallet type
export type QrData = {
  type: QrTypesEnum;
  [x: string]: any;
}

// TODO mobile wallet type
export type CredentialTypeSelection = {
  id: string;
  credentialType: string;
  credentialAlias: string;
  isSelected: boolean;
}

// TODO
export type InitiationData = { // TODO name
  authorizationCodeURL?: string
  credentialBranding: any // TODO MAP should be serializable
  credentialsSupported: Array<any> // TODO
  serverMetadata: any // TODO
  openID4VCIClientState: string
}

// TODO mobile wallet type
export type SelectAppLocaleBrandingArgs = {
  locale?: string
  localeBranding?: Array<IBasicCredentialLocaleBranding | IBasicIssuerLocaleBranding>;
}
// TODO mobile wallet type
export interface GetCredentialsArgs {
  pin?: string;
  credentials?: Array<string>; // TODO why optional? we need credentials?
  openID4VCIClientState: OpenID4VCIClientState
}
// TODO mobile wallet type
export interface CredentialFromOffer {
  id?: string;
  issuanceOpt: IssuanceOpts;
  credentialResponse: CredentialResponse;
}
// TODO mobile wallet type
export type IssuanceOpts = CredentialSupported & {
  didMethod: SupportedDidMethodEnum;
  keyType: TKeyType;
};
// TODO mobile wallet type
export enum SupportedDidMethodEnum {
  DID_ETHR = 'ethr',
  DID_KEY = 'key',
  DID_LTO = 'lto',
  DID_ION = 'ion',
  DID_FACTOM = 'factom',
  DID_JWK = 'jwk',
}

// TODO mobile wallet type
export type VerificationResult = {
  result: boolean;
  source: WrappedVerifiableCredential | WrappedVerifiablePresentation;
  subResults: Array<VerificationSubResult>;
  error?: string | undefined;
  errorDetails?: string;
}
// TODO mobile wallet type
export type VerificationSubResult = {
  result: boolean;
  error?: string;
  errorDetails?: string;
}
// TODO mobile wallet type
export type CredentialToAccept = {
  id?: string;
  issuanceOpt: IssuanceOpts;
  credentialResponse: CredentialResponse;
}

export type RequiredContext = IAgentContext<IIssuanceBranding | IContactManager | ICredentialPlugin | IDataStore | IDataStoreORM>
