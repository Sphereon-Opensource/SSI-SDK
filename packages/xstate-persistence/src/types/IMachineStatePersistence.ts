import { IPluginMethodMap } from '@veramo/core'

import {
  DeleteExpiredStatesArgs,
  DeleteStateResult,
  FindActiveStatesArgs,
  MachineStateInfo,
  MachineStateInit,
  InitMachineStateArgs,
  RequiredContext,
  MachineStatePersistArgs,
} from './types'

/**
 * The interface definition for a plugin that can issue and verify Verifiable Credentials and Presentations
 * that use JSON-LD format.
 *
 * @remarks Please see {@link https://www.w3.org/TR/vc-data-model | W3C Verifiable Credentials data model}
 *
 * @beta This API is likely to change without a BREAKING CHANGE notice
 */
export interface IMachineStatePersistence extends IPluginMethodMap {
  /**
   * Loads the states of active xstate machines from the database.
   *
   * @param args FindActiveStatesArgs
   * type of the event
   *
   * @returns state or null
   *
   * @beta This API is likely to change without a BREAKING CHANGE notice
   */
  machineStatesFindActive(args: FindActiveStatesArgs): Promise<Array<MachineStateInfo>>

  /**
   * Deletes the state of an xstate machine in the database.
   *
   * @param args DeleteExpiredStatesArgs
   * type: optional type of the machine
   *
   * @beta This API is likely to change without a BREAKING CHANGE notice
   */
  machineStatesDeleteExpired(args: DeleteExpiredStatesArgs): Promise<DeleteStateResult>

  /**
   * Initializes a state object for a new machine. Does not persist anything
   * @param args Requires a machineName, instanceId and tenantId are optional
   */
  machineStateInit(args: InitMachineStateArgs): Promise<MachineStateInit>

  /**
   * Persists the state whenever an event is emitted
   * @param args NonPersistedMachineInstance
   *
   * @param context
   * @beta This API is likely to change without a BREAKING CHANGE notice
   */
  machineStatePersist(args: MachineStatePersistArgs, context: RequiredContext): Promise<MachineStateInfo>
}
