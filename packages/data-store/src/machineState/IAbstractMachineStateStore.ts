import {
  StoreMachineStateDeleteExpiredArgs,
  StoreMachineStateDeleteArgs,
  StoreMachineStatesFindActiveArgs,
  StoreFindMachineStatesArgs,
  StoreMachineStatePersistArgs,
  StoreMachineStateInfo,
  StoreMachineStateGetArgs,
} from '../types'

export abstract class IAbstractMachineStateStore {
  abstract persistMachineState(state: StoreMachineStatePersistArgs): Promise<StoreMachineStateInfo>
  abstract findActiveMachineStates(args: StoreMachineStatesFindActiveArgs): Promise<Array<StoreMachineStateInfo>>
  abstract getMachineState(args: StoreMachineStateGetArgs): Promise<StoreMachineStateInfo>
  abstract findMachineStates(args?: StoreFindMachineStatesArgs): Promise<Array<StoreMachineStateInfo>>
  abstract deleteMachineState(args: StoreMachineStateDeleteArgs): Promise<boolean>
  abstract deleteExpiredMachineStates(args: StoreMachineStateDeleteExpiredArgs): Promise<boolean>
}
