import { IAbstractMachineStateStore, StoreMachineStateInfo } from '@sphereon/ssi-sdk.data-store'
import { IAgentPlugin } from '@veramo/core'
import Debug from 'debug'
import { v4 as uuidv4 } from 'uuid'
import { deserializeMachineState, machineStateToStoreInfo } from '../functions'

import {
  DeleteExpiredStatesArgs,
  DeleteStateResult,
  InitMachineStateArgs,
  MachineStateInfo,
  MachineStateInit,
  MachineStatePersistArgs,
  MachineStatePersistEvent,
  MachineStatePersistEventType,
  MachineStatePersistOpts,
  RequiredContext,
  schema,
} from '../index'
import { FindActiveStatesArgs, IMachineStatePersistence } from '../types'

const debug = Debug('sphereon:ssi-sdk:machine-state:xstate-persistence')

/**
 * This class implements the IMachineStatePersistence interface using a datastore.
 *
 * This allows you to store and retrieve the State of a state machine/application by their types.
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
export class MachineStatePersistence implements IAgentPlugin {
  readonly schema = schema.IMachineStatePersistence
  readonly methods: IMachineStatePersistence
  readonly eventTypes: Array<string>
  readonly store: IAbstractMachineStateStore

  constructor(opts: MachineStatePersistOpts) {
    const { store, eventTypes } = opts

    this.store = store
    this.eventTypes = eventTypes

    if (!this.store) {
      throw Error('No store available in options')
    }
    this.methods = {
      machineStatesFindActive: this.machineStatesFindActive.bind(this),
      machineStatesDeleteExpired: this.machineStatesDeleteExpired.bind(this),
      machineStateInit: this.machineStateInit.bind(this),
      machineStatePersist: this.machineStatePersist.bind(this),
    }
  }

  public async onEvent(event: MachineStatePersistEvent, context: RequiredContext): Promise<void> {
    if (!this.eventTypes.includes(event.type)) {
      return
    }
    switch (event.type) {
      case MachineStatePersistEventType.INIT:
        // Calling the context of the agent instead of this to make sure the REST client is called when configured
        await context.agent.machineStateInit({ ...event.data })
        break
      case MachineStatePersistEventType.EVERY:
        // Calling the context of the agent instead of this to make sure the REST client is called when configured
        void context.agent.machineStatePersist({ ...event.data })
        break
      default:
        return Promise.reject(Error('Event type not supported'))
    }
  }

  private async machineStateInit(args: InitMachineStateArgs): Promise<MachineStateInit> {
    debug(`machineStateInit for machine name ${args.machineName} and tenant ${args.tenantId}`)
    const machineInit = {
      ...args,
      instanceId: args.instanceId ?? uuidv4(),
      createdAt: args.createdAt ?? new Date(),
    }
    debug(`machineStateInit result: ${JSON.stringify(machineInit)}`)
    return machineInit
  }
  private async machineStatePersist(args: MachineStatePersistArgs): Promise<MachineStateInfo> {
    const { instanceId, tenantId, machineName } = args
    debug(`machineStatePersist for machine name ${machineName}, instance ${instanceId} and tenant ${tenantId}...`)
    const queriedStates = await this.store.findMachineStates({ filter: [{ instanceId, tenantId }] })
    const existingState = queriedStates.length === 1 ? queriedStates[0] : undefined
    const storeInfoArgs = machineStateToStoreInfo(args, existingState)
    const storedState = await this.store.persistMachineState(storeInfoArgs)
    const machineStateInfo = { ...storedState, state: deserializeMachineState(storedState.state) }
    debug(
      `machineStatePersist success for machine name ${machineName}, instance ${instanceId}, tenant ${tenantId}, last event: ${machineStateInfo.latestEventType}, last state: ${machineStateInfo.latestStateName}`
    )
    return machineStateInfo
  }

  private async machineStatesFindActive(args: FindActiveStatesArgs): Promise<Array<MachineStateInfo>> {
    const { machineName, tenantId } = args
    debug(`machineStateFindActive for machine name ${machineName} and tenant ${tenantId}...`)
    const storedStates = await this.store.findActiveMachineStates(args)
    const machineStateInfos = storedStates.map((storedState: StoreMachineStateInfo) => {
      return { ...storedState, state: deserializeMachineState(storedState.state) }
    })
    debug(`machineStateFindActive returned ${machineStateInfos.length} results for machine name ${machineName} and tenant ${tenantId}`)
    return machineStateInfos
  }

  private async machineStatesDeleteExpired(args: DeleteExpiredStatesArgs): Promise<DeleteStateResult> {
    return this.store.deleteExpiredMachineStates(args)
  }
}
