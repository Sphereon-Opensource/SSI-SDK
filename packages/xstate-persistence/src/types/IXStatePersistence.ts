import {IPluginMethodMap} from '@veramo/core'

import {
  DeleteExpiredStatesArgs,
  DeleteStateResult,
  LoadStateArgs,
  LoadStateResult,
  OnEventResult,
  RequiredContext,
  XStatePersistenceEvent
} from "./types";

/**
 * The interface definition for a plugin that can issue and verify Verifiable Credentials and Presentations
 * that use JSON-LD format.
 *
 * @remarks Please see {@link https://www.w3.org/TR/vc-data-model | W3C Verifiable Credentials data model}
 *
 * @beta This API is likely to change without a BREAKING CHANGE notice
 */
export interface IXStatePersistence extends IPluginMethodMap {
  /**
   * Loads the state of an xstate machine from the database.
   *
   * @param args LoadStateArgs
   * type of the event
   *
   * @returns state or null
   *
   * @beta This API is likely to change without a BREAKING CHANGE notice
   */
  loadState(args: LoadStateArgs): Promise<LoadStateResult>


  /**
   * Deletes the state of an xstate machine in the database.
   *
   * @param args DeleteExpiredStatesArgs
   * duration in milliseconds
   * dialect 'SQLite3' or 'PostgreSQL'
   *
   * @beta This API is likely to change without a BREAKING CHANGE notice
   */
  deleteExpiredStates(args: DeleteExpiredStatesArgs): Promise<DeleteStateResult>

  /**
   * Persists the state whenever an event is emitted
   * @param event XStatePersistenceEvent
   * type of the event ('every' is the only one available at the moment)
   * data of the event
   *
   * @param context
   * @beta This API is likely to change without a BREAKING CHANGE notice
   */
  onEvent(event: XStatePersistenceEvent, context: RequiredContext): Promise<OnEventResult>
}
