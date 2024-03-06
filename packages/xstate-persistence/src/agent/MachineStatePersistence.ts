import { IAbstractMachineStateInfoStore, StoreMachineStateInfo } from '@sphereon/ssi-sdk.data-store'
import { IAgentPlugin } from '@veramo/core'
import { machineStateToStoreInfo } from '../functions'

import {
  DeleteExpiredStatesArgs,
  DeleteStateResult,
  MachineStatePersistEventType,
  MachineStateInfo,
  NonPersistedMachineInstance,
  MachineStatePersistEvent,
  RequiredContext,
  schema,
  MachineStatePersistOpts,
} from '../index'
import { FindActiveStatesArgs, IMachineStatePersistence } from '../types'

/**
 * This class implements the IXStateStateManager interface using a TypeORM compatible database.
 *
 * This allows you to store and retrieve the State of a state machine/application by their types.
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
export class MachineStatePersistence implements IAgentPlugin {
  readonly schema = schema.IXStatePersistence
  readonly methods: IMachineStatePersistence
  readonly eventTypes: Array<string>
  readonly store: IAbstractMachineStateInfoStore

  constructor(opts: MachineStatePersistOpts) {
    const { store, eventTypes } = opts

    this.store = store
    this.eventTypes = eventTypes

    this.methods = {
      machineStatesFindActive: this.machineStatesFindActive.bind(this),
      machineStatesDeleteExpired: this.machineStatesDeleteExpired.bind(this),
      machineStatePersist: this.machineStatePersist.bind(this),
    }
  }

  public async onEvent(event: MachineStatePersistEvent, context: RequiredContext): Promise<void> {
    switch (event.type) {
      case MachineStatePersistEventType.EVERY:
        // Calling the context of the agent to make sure the REST client is called when configured
        await context.agent.machineStatePersist({ ...event.data })
        break
      default:
        return Promise.reject(Error('Event type not supported'))
    }
  }

  private async machineStatePersist(args: NonPersistedMachineInstance): Promise<MachineStateInfo> {
    if (!this.store) {
      return Promise.reject(Error('No store available in options'))
    }
    const id = args.state._sessionid
    if (!id) {
      throw Error(`Machine ${args.machineId} did not have an instance/session id associated`)
    }
    const queriedStates = await this.store.findMachineStates({ filter: [{ id }] })
    const existingState = queriedStates.length === 1 ? queriedStates[0] : undefined
    const storeInfoArgs = machineStateToStoreInfo(args, existingState)
    const storedState = await this.store.persistMachineState(storeInfoArgs)
    return { ...storedState, state: JSON.parse(storedState.state) }
  }

  private async machineStatesFindActive(args: FindActiveStatesArgs): Promise<Array<MachineStateInfo>> {
    if (!this.store) {
      return Promise.reject(Error('No store available in options'))
    }
    const storedStates = await this.store.findActiveMachineStates(args)
    return storedStates.map((storedState: StoreMachineStateInfo) => {
      return { ...storedState, state: JSON.parse(storedState.state) }
    })
  }

  private async machineStatesDeleteExpired(args: DeleteExpiredStatesArgs): Promise<DeleteStateResult> {
    if (!this.store) {
      return Promise.reject(Error('No store available in options'))
    }
    return this.store.deleteExpiredMachineStates(args)
  }
}
