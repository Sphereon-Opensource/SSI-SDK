import { IPluginMethodMap } from '@veramo/core'

import {
  DeleteExpiredStatesArgs,
  DeleteStateResult,
  FindActiveStatesArgs,
  MachineStateInfo,
  NonPersistedMachineInstance,
  RequiredContext,
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
   * @param args LoadStateArgs
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
   * Persists the state whenever an event is emitted
   * @param event NonPersistedXStatePersistenceEvent
   * type of the event ('every' is the only one available at the moment)
   * data of the event
   *
   * @param context
   * @beta This API is likely to change without a BREAKING CHANGE notice
   */
  machineStatePersist(event: NonPersistedMachineInstance, context: RequiredContext): Promise<MachineStateInfo>
}
