import {DeleteStateArgs, GetStateArgs, SaveStateArgs, State, VoidResult} from "../types";

export abstract class IAbstractXStateStore {
    abstract saveState(state: SaveStateArgs): Promise<State>
    abstract getState(args: GetStateArgs): Promise<State>
    abstract deleteState(args: DeleteStateArgs): Promise<VoidResult>
}
