import {
  StoreDeleteExpiredMachineArgs,
  StoreDeleteMachineArgs,
  StoreFindActiveMachinesArgs,
  StoreFindMachinesArgs,
  StorePersistMachineArgs,
  StoreMachineStateInfo,
  StoreGetMachineArgs,
} from '../types'

export abstract class IAbstractMachineStateInfoStore {
  abstract persistMachineState(state: StorePersistMachineArgs): Promise<StoreMachineStateInfo>
  abstract findActiveMachineStates(args: StoreFindActiveMachinesArgs): Promise<Array<StoreMachineStateInfo>>
  abstract getMachineState(args: StoreGetMachineArgs): Promise<StoreMachineStateInfo>
  abstract findMachineStates(args?: StoreFindMachinesArgs): Promise<Array<StoreMachineStateInfo>>
  abstract deleteMachineState(args: StoreDeleteMachineArgs): Promise<boolean>
  abstract deleteExpiredMachineStates(args: StoreDeleteExpiredMachineArgs): Promise<boolean>
}
