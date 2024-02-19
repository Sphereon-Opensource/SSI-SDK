import {GetStateArgs, GetStateResult, SaveStateArgs, VoidResult} from "../types";

export abstract class IAbstractXStateStore {
    abstract saveState(state: SaveStateArgs): Promise<VoidResult>
    abstract getState(args: GetStateArgs): Promise<GetStateResult>
    abstract deleteState(args: GetStateArgs): Promise<VoidResult>
}
