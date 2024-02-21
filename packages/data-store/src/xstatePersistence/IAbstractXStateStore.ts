import {DeleteStateArgs, GetStateArgs, GetStatesArgs, SaveStateArgs, State, VoidResult} from "../types";

export abstract class IAbstractXStateStore {
    abstract saveState(state: SaveStateArgs): Promise<State>
    abstract getState(args: GetStateArgs): Promise<State>
    abstract getStates(args?: GetStatesArgs): Promise<Array<State>>
    abstract deleteState(args: DeleteStateArgs): Promise<VoidResult>
}
