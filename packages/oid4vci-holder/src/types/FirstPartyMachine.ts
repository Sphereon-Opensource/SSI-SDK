import { RPRegistrationMetadataPayload } from '@sphereon/did-auth-siop'
import { OpenID4VCIClientState } from '@sphereon/oid4vci-client'
import { AuthorizationChallengeCodeResponse } from '@sphereon/oid4vci-common'
import { UniqueDigitalCredential } from '@sphereon/ssi-sdk.credential-store'
import { DidAuthConfig, Party } from '@sphereon/ssi-sdk.data-store'
import { IIdentifier } from '@veramo/core'
import { DcqlQuery } from 'dcql'
import { BaseActionObject, Interpreter, ResolveTypegenMeta, ServiceMap, State, StateMachine, StatesConfig, TypegenDisabled } from 'xstate'
import { ErrorDetails, RequiredContext } from './IOID4VCIHolder'

export enum FirstPartyMachineStateTypes {
  sendAuthorizationChallengeRequest = 'sendAuthorizationChallengeRequest',
  sendAuthorizationResponse = 'sendAuthorizationResponse',
  selectCredentials = 'selectCredentials',
  createConfig = 'createConfig',
  getSiopRequest = 'getSiopRequest',
  error = 'error',
  done = 'done',
  aborted = 'aborted',
  declined = 'declined',
}

export enum FirstPartyMachineServices {
  sendAuthorizationChallengeRequest = 'sendAuthorizationChallengeRequest',
  sendAuthorizationResponse = 'sendAuthorizationResponse',
  createConfig = 'createConfig',
  getSiopRequest = 'getSiopRequest',
}

export type FirstPartyMachineStates = Record<FirstPartyMachineStateTypes, {}>

export type FirstPartyMachineContext = {
  openID4VCIClientState: OpenID4VCIClientState
  selectedCredentials: Array<UniqueDigitalCredential>
  contact: Party
  authSession?: string
  presentationUri?: string
  identifier?: IIdentifier
  didAuthConfig?: Omit<DidAuthConfig, 'identifier'>
  authorizationRequestData?: SiopV2AuthorizationRequestData
  presentationDuringIssuanceSession?: string
  authorizationCodeResponse?: AuthorizationChallengeCodeResponse
  error?: ErrorDetails
}

export enum FirstPartyMachineEvents {
  NEXT = 'NEXT',
  PREVIOUS = 'PREVIOUS',
  DECLINE = 'DECLINE',
  SET_SELECTED_CREDENTIALS = 'SET_SELECTED_CREDENTIALS',
}

export type FirstPartyNextEvent = { type: FirstPartyMachineEvents.NEXT }
export type FirstPartyPreviousEvent = { type: FirstPartyMachineEvents.PREVIOUS }
export type FirstPartyDeclineEvent = { type: FirstPartyMachineEvents.DECLINE }
export type FirstPartySelectCredentialsEvent = {
  type: FirstPartyMachineEvents.SET_SELECTED_CREDENTIALS
  data: Array<UniqueDigitalCredential>
}

export type FirstPartyMachineEventTypes = FirstPartyNextEvent | FirstPartyPreviousEvent | FirstPartyDeclineEvent | FirstPartySelectCredentialsEvent

export type FirstPartyMachineStatesConfig = StatesConfig<
  FirstPartyMachineContext,
  {
    states: FirstPartyMachineStates
  },
  FirstPartyMachineEventTypes,
  any
>

export type CreateFirstPartyMachineOpts = {
  openID4VCIClientState: OpenID4VCIClientState
  contact: Party
  agentContext: RequiredContext
  machineId?: string
}

export type FirstPartyStateMachine = StateMachine<
  FirstPartyMachineContext,
  any,
  FirstPartyMachineEventTypes,
  {
    value: any
    context: FirstPartyMachineContext
  },
  BaseActionObject,
  ServiceMap,
  ResolveTypegenMeta<TypegenDisabled, FirstPartyMachineEventTypes, BaseActionObject, ServiceMap>
>

export type FirstPartyMachineInterpreter = Interpreter<
  FirstPartyMachineContext,
  any,
  FirstPartyMachineEventTypes,
  {
    value: any
    context: FirstPartyMachineContext
  },
  any
>

export type FirstPartyMachineStateNavigationListener = (
  firstPartyMachine: FirstPartyMachineInterpreter,
  state: FirstPartyMachineState,
  navigation?: any,
) => Promise<void>

export type InstanceFirstPartyMachineOpts = {
  services?: any
  guards?: any
  subscription?: () => void
  requireCustomNavigationHook?: boolean
  stateNavigationListener?: FirstPartyMachineStateNavigationListener
} & CreateFirstPartyMachineOpts

export type FirstPartyMachineState = State<
  FirstPartyMachineContext,
  FirstPartyMachineEventTypes,
  any,
  {
    value: any
    context: FirstPartyMachineContext
  },
  any
>

export type FirstPartyMachineServiceDefinitions = Record<keyof typeof FirstPartyMachineServices, (...args: Array<any>) => any>

export type SendAuthorizationChallengeRequestArgs = Pick<
  FirstPartyMachineContext,
  'openID4VCIClientState' | 'authSession' | 'presentationDuringIssuanceSession'
>

export type SendAuthorizationResponseArgs = Pick<
  FirstPartyMachineContext,
  'authSession' | 'presentationUri' | 'didAuthConfig' | 'authorizationRequestData' | 'selectedCredentials'
>

export type CreateConfigArgs = Pick<FirstPartyMachineContext, 'presentationUri' | 'identifier'>

export type GetSiopRequestArgs = Pick<FirstPartyMachineContext, 'didAuthConfig' | 'presentationUri'>

export type SiopV2AuthorizationRequestData = {
  correlationId: string
  registrationMetadataPayload: RPRegistrationMetadataPayload
  issuer?: string
  name?: string
  uri?: URL
  clientIdScheme?: string
  clientId?: string
  entityId?: string
  dcqlQuery: DcqlQuery
}

export type FirstPartyMachineNavigationArgs = {
  firstPartyMachine: FirstPartyMachineInterpreter
  state: FirstPartyMachineState
  navigation: any
  onNext?: () => void
  onBack?: () => void
}
