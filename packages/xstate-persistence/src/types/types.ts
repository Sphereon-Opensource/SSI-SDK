import {
  IAbstractMachineStateStore,
  StoreMachineStateDeleteExpiredArgs,
  StoreMachineStateInfo,
  StoreMachineStatesFindActiveArgs,
} from '@sphereon/ssi-sdk.data-store'
import { IAgentContext } from '@veramo/core'
import {
  AnyEventObject,
  DefaultContext,
  EventObject,
  HistoryValue,
  Interpreter,
  SCXML,
  StateSchema,
  StateValue,
  TypegenDisabled,
  Typestate,
} from 'xstate'

import { IMachineStatePersistence } from './IMachineStatePersistence'

/**
 * Represents the options for persisting machine state.
 *
 * @typedef {Object} MachineStatePersistOpts
 * @property {IAbstractMachineStateStore} store - The store used to persist the machine state.
 * @property {Array<string>} eventTypes - The types of events to be persisted.
 */
export type MachineStatePersistOpts = { store?: IAbstractMachineStateStore; eventTypes: Array<string>; isRESTClient?: boolean }

/**
 * Enum representing the types of machine state persist events.
 * @enum {string}
 */
export enum MachineStatePersistEventType {
  INIT = 'INIT',
  EVERY = 'EVERY',
}

/**
 * Represents the arguments for deleting expired states from a machine.
 */
export type DeleteExpiredStatesArgs = Pick<StoreMachineStateDeleteExpiredArgs, 'deleteDoneStates' | 'machineName' | 'tenantId'>

/**
 * Represents the arguments for finding active states of a store machine.
 */
export type FindActiveStatesArgs = StoreMachineStatesFindActiveArgs

/**
 * Represents the result of a state deletion operation.
 *
 * @typedef {number} DeleteStateResult
 */
export type DeleteStateResult = number

/**
 * Represents a machine state persist event.
 *
 * @typedef {Object} MachineStatePersistEvent
 * @property {MachineStatePersistEventType} type - The type of the persist event.
 * @property {MachineStatePersistArgs} data - The data associated with the persist event, along with additional properties `_eventCounter` and `_eventDate`.
 * @property {number} data._eventCounter - The counter for the persist event.
 * @property {Date} data._eventDate - The date and time the persist event occurred.
 */
export type MachineStatePersistEvent = {
  type: MachineStatePersistEventType
  data: Omit<MachineStatePersistArgs, 'machineState'> & {
    _eventCounter: number
    _eventDate: Date
    _cleanupOnFinalState: boolean
  }
}

/**
 * Represents a RequiredContext class, which is a type definition for the context required by an agent.
 * It is used to enforce that the agent context implements the necessary interfaces.
 *
 * @typeparam T - The type of the machine state persistence.
 */
export type RequiredContext = IAgentContext<IMachineStatePersistence>

/**
 * Represents the information about the current state of a machine.
 * @typedef {Object} MachineStateInfo
 * @property {string} id - The ID of the machine.
 * @property {SerializableState} state - The serializable state of the machine.
 * @property {string} description - The description of the machine state.
 */
export type MachineStateInfo = Omit<StoreMachineStateInfo, 'state'> & {
  state: SerializableState
}

export type MachineStatePersistenceOpts = {
  disablePersistence?: boolean // Disable persistence altogether
  customInstanceId?: string // Used when creating a machine using a custom new instance id
  existingInstanceId?: string // Used when creating a machine using an existing instance (rehydrating a persisted machine)
  expireInMS?: number // Expire in an amount of MS (takes precedence over date if both are provided!)
  expiresAt?: Date // Expire at a specific date
}

export type MachineStateInitType = 'new' | 'existing'

/**
 * Represents the initial state for a machine.
 *
 * @typedef {Object} MachineStateInit
 * @property {string} existingInstanceId - The unique identifier for the machine instance.
 * @property {string} machineName - The name of the machine.
 * @property {string} tenantId - The identifier for the tenant associated with the machine.
 * @property {Date} createdAt - The date and time when the machine was created.
 * @property {Date} expiresAt - The date and time when the machine's state expires.
 */
export type MachineStateInit = Pick<MachineStateInfo, 'instanceId' | 'machineName' | 'tenantId' | 'createdAt' | 'expiresAt'> & {
  stateType: MachineStateInitType
  machineState?: MachineStateInfo // Only available when stateType is 'existing'
}

/**
 * Represents the arguments required to initialize the machine state.
 * @typedef {Object} InitMachineStateArgs
 * @property {string} machineName - The name of the machine.
 * @property {Partial<MachineStateInit>} [additionalArgs] - Additional initialization arguments for the machine state.
 */
export type InitMachineStateArgs = Omit<Partial<MachineStateInit>, 'instanceId'> &
  Pick<MachineStateInfo, 'machineName'> &
  Pick<MachineStatePersistenceOpts, 'customInstanceId' | 'existingInstanceId'> & { cleanupAllOtherInstances?: boolean }

/**
 * Represents the arguments required to persist the machine state.
 */
export type MachineStatePersistArgs = Omit<MachineStateInit, 'createdAt'> &
  Pick<MachineStateInfo, 'state' | 'instanceId'> &
  Partial<Pick<MachineStateInfo, 'updatedCount'>> & { cleanupOnFinalState?: boolean }

/**
 * Represents the arguments required to get machine state.
 * @typedef {Object} MachineStateGetArgs
 * @property {string} existingInstanceId - The ID of the machine instance.
 * @property {string} tenantId - The ID of the tenant the machine belongs to.
 */
export type MachineStateGetArgs = Pick<StoreMachineStateInfo, 'instanceId' | 'tenantId'>

/**
 * Represents the arguments required for deleting a machine state.
 *
 * @typedef {object} MachineStateDeleteArgs
 * @property {string} existingInstanceId - The ID of the machine instance to delete the state for.
 * @property {string} tenantId - The ID of the tenant owning the machine instance.
 */
export type MachineStateDeleteArgs = Pick<StoreMachineStateInfo, 'instanceId' | 'tenantId'>

/**
 * Represents the information for a started interpreter.
 *
 * @template TContext The type of the context object.
 * @template TStateSchema The type of the state schema.
 * @template TEvent The type of the event object.
 * @template TTypestate The type of the typestate object.
 * @template TResolvedTypesMeta The type of the resolved types meta object.
 */
export type StartedInterpreterInfo<
  TContext = DefaultContext,
  TStateSchema extends StateSchema = any,
  TEvent extends EventObject = EventObject,
  TTypestate extends Typestate<TContext> = {
    value: any
    context: TContext
  },
  TResolvedTypesMeta = TypegenDisabled,
> = {
  interpreter: Interpreter<TContext, TStateSchema, TEvent, TTypestate, TResolvedTypesMeta>
  machineState?: MachineStateInfo
  init: MachineStateInit
}

/**
 * Represents the serializable state of a machine.
 *
 * @typedef {Object} SerializableState
 * @property {XStateConfig<any, AnyEventObject>} config - The machine configuration.
 */
export type SerializableState = XStateConfig<any, AnyEventObject>

/**
 * The configuration for the XState machine state. Simplified StateConfig object from XState so we have a minimal typed structure
 *
 * @template TContext - The context type for the state.
 * @template TEvent - The event type for the state.
 */
export interface XStateConfig<TContext, TEvent extends EventObject> {
  value: StateValue
  context: TContext
  _event: SCXML.Event<TEvent>
  _sessionid: string | null
  historyValue?: HistoryValue | undefined
  history?: any
  actions?: Array<any>
  activities?: any
  meta?: any
  events?: TEvent[]
  configuration: Array<any>
  transitions: Array<any>
  children: Record<string, any>
  done?: boolean
  tags?: Set<string>
  machine?: any
}
