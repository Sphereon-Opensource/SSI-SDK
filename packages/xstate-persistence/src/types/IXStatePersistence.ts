import {IPluginMethodMap} from '@veramo/core'

import {
  DeleteStateArgs,
  DeleteStateResult,
  LoadStateArgs,
  LoadStateResult, OnEventResult,
  PersistStateArgs,
  PersistStateResult, RequiredContext, XStatePersistenceEvent
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
   * Persist the state and history of xstate machines
   *
   * @param state
   *
   * @beta This API is likely to change without a BREAKING CHANGE notice
   */
  persistState(state: PersistStateArgs): Promise<PersistStateResult>

  /**
   * Loads the state of an xstate machine from the database.
   *
   * @param args
   *
   * @returns state or null
   *
   * @beta This API is likely to change without a BREAKING CHANGE notice
   */
  loadState(args: LoadStateArgs): Promise<LoadStateResult>


  /**
   * Deletes the state of an xstate machine in the database.
   *
   * @param args
   *
   * @beta This API is likely to change without a BREAKING CHANGE notice
   */
  deleteState(args: DeleteStateArgs): Promise<DeleteStateResult>

  /**
   * Persists the state whenever an event is emitted
   * @param event
   * @param context
   * @beta This API is likely to change without a BREAKING CHANGE notice
   */
  onEvent(event: XStatePersistenceEvent, context: RequiredContext): Promise<OnEventResult>
}
