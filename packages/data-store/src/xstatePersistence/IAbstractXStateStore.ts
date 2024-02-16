import {LoadStateArgs, LoadStateResult, PersistStateArgs, VoidResult} from "../types";

export abstract class IAbstractXStateStore {
    abstract persistState(state: PersistStateArgs): Promise<VoidResult>
    abstract loadState(args: LoadStateArgs): Promise<LoadStateResult>
    abstract deleteState(args: LoadStateArgs): Promise<VoidResult>
}
