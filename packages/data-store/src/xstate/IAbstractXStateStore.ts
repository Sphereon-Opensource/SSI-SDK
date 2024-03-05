import { DeleteExpiredStateArgs, DeleteStateArgs, GetActiveStateArgs, GetStatesArgs, SaveStateArgs, State } from '../types'

export abstract class IAbstractXStateStore {
  abstract saveState(state: SaveStateArgs): Promise<State>
  abstract getActiveState(args: GetActiveStateArgs): Promise<State>
  abstract getStates(args?: GetStatesArgs): Promise<Array<State>>
  abstract deleteState(args: DeleteStateArgs): Promise<boolean>
  abstract deleteExpiredStates(args: DeleteExpiredStateArgs): Promise<boolean>
}
