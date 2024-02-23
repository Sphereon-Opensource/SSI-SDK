import { DeleteStateArgs, GetStateArgs, GetStatesArgs, SaveStateArgs, State } from '../types'

export abstract class IAbstractXStateStore {
  abstract saveState(state: SaveStateArgs): Promise<State>
  abstract getState(args: GetStateArgs): Promise<State>
  abstract getStates(args?: GetStatesArgs): Promise<Array<State>>
  abstract deleteState(args: DeleteStateArgs): Promise<boolean>
}
