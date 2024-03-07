import {
  StoreMachineStateDeleteExpiredArgs,
  StoreMachineStateDeleteArgs,
  StoreMachineStatesFindActiveArgs,
  StoreFindMachineStatesArgs,
  StoreMachineStatePersistArgs,
  StoreMachineStateInfo,
  StoreMachineStateGetArgs,
} from '../types'

/**
 * Represents an abstract class for storing machine states.
 * This class provides methods for persisting, retrieving, and deleting machine states.
 *
 * @interface
 */
export abstract class IAbstractMachineStateStore {
  /**
   * Persists the machine state.
   *
   * @param {StoreMachineStatePersistArgs} state - The object containing the machine state to persist.
   * @return {Promise<StoreMachineStateInfo>} - A Promise that resolves to the information about the persisted machine state.
   */
  abstract persistMachineState(state: StoreMachineStatePersistArgs): Promise<StoreMachineStateInfo>

  /**
   * Finds active machine states based on the given arguments.
   *
   * @param {StoreMachineStatesFindActiveArgs} args - The arguments for finding active machine states.
   * @return {Promise<Array<StoreMachineStateInfo>>} - A promise that resolves with an array of active machine states.
   */
  abstract findActiveMachineStates(args: StoreMachineStatesFindActiveArgs): Promise<Array<StoreMachineStateInfo>>

  /**
   * Retrieves the state of a particular machine.
   *
   * @param {StoreMachineStateGetArgs} args - The arguments for retrieving the machine state.
   * @returns {Promise<StoreMachineStateInfo>} - A promise that resolves to the machine state information.
   */
  abstract getMachineState(args: StoreMachineStateGetArgs): Promise<StoreMachineStateInfo>

  /**
   * Finds the machine states based on the given arguments.
   *
   * @param {StoreFindMachineStatesArgs} [args] - The arguments to filter the machine states.
   * @returns {Promise<Array<StoreMachineStateInfo>>} - A promise that resolves to an array of machine state information.
   */
  abstract findMachineStates(args?: StoreFindMachineStatesArgs): Promise<Array<StoreMachineStateInfo>>

  /**
   * Deletes a machine state.
   *
   * @param {StoreMachineStateDeleteArgs} args - The arguments for deleting the machine state.
   * @return {Promise<boolean>} - A promise that resolves to a boolean indicating if the machine state was successfully deleted or not.
   */
  abstract deleteMachineState(args: StoreMachineStateDeleteArgs): Promise<boolean>

  /**
   * Deletes expired machine states from the database.
   *
   * @param {StoreMachineStateDeleteExpiredArgs} args - The arguments for deleting expired machine states.
   * @return {Promise<number>} - A promise that resolves to the number of deleted machine states.
   */
  abstract deleteExpiredMachineStates(args: StoreMachineStateDeleteExpiredArgs): Promise<number>
}
