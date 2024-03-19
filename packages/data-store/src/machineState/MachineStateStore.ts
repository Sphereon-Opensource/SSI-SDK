import { OrPromise } from '@sphereon/ssi-types'
import Debug from 'debug'
import { Brackets, DataSource, FindOptionsWhere, IsNull, LessThan, Not } from 'typeorm'

import { MachineStateInfoEntity } from '../entities/machineState/MachineStateInfoEntity'
import {
  StoreFindMachineStatesArgs,
  StoreMachineStateDeleteArgs,
  StoreMachineStateDeleteExpiredArgs,
  StoreMachineStateGetArgs,
  StoreMachineStateInfo,
  StoreMachineStatePersistArgs,
  StoreMachineStatesFindActiveArgs,
} from '../types'
import { IAbstractMachineStateStore } from './IAbstractMachineStateStore'

const debug = Debug('sphereon:ssi-sdk:machine-state:store')

/**
 * Represents a data store for managing machine states.
 */
export class MachineStateStore extends IAbstractMachineStateStore {
  private readonly _dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    super()
    this._dbConnection = dbConnection
  }

  async persistMachineState(state: StoreMachineStatePersistArgs): Promise<StoreMachineStateInfo> {
    const connection: DataSource = await this._dbConnection
    const { machineName, instanceId, tenantId } = state
    debug(`Executing persistMachineState for machine ${machineName}, instance ${instanceId}, tenantId: ${tenantId}...`)
    const entity = MachineStateStore.machineStateInfoEntityFrom(state)
    const existing = await connection.getRepository(MachineStateInfoEntity).findOne({
      where: {
        instanceId: state.instanceId,
      },
    })
    if (existing && existing.updatedCount > state.updatedCount) {
      const error = `Updating machine state with an older version is not allowed. Machine ${existing.machineName}, last count: ${
        existing.updatedCount
      }, new count: ${existing.updatedCount}, last updated: ${existing.updatedAt}, current: ${new Date()}, instance: ${existing.instanceId}`
      console.log(error)
      return Promise.reject(new Error(error))
    }
    // No need for a transaction. This is a single entity. We don't want to be surprised by an isolation level hiding the state from others
    const result = await connection.getRepository(MachineStateInfoEntity).save(entity, { transaction: false })
    debug(`Done persistMachineState machine ${machineName}, instance ${instanceId}, tenantId: ${tenantId}`)
    return MachineStateStore.machineInfoFrom(result)
  }

  async findActiveMachineStates(args: StoreMachineStatesFindActiveArgs): Promise<Array<StoreMachineStateInfo>> {
    const { tenantId, machineName, instanceId } = args
    const connection: DataSource = await this._dbConnection
    debug(`Executing findActiveMachineStates query with machineName: ${machineName}, tenantId: ${tenantId}`)
    const queryBuilder = connection
      .getRepository(MachineStateInfoEntity)
      .createQueryBuilder('state')
      .where('state.completedAt IS NULL')
      .andWhere(
        new Brackets((qb) => {
          qb.where('state.expiresAt IS NULL').orWhere('state.expiresAt > :now', { now: new Date() })
        }),
      )

    if (instanceId) {
      queryBuilder.andWhere('state.instanceId = :instanceId', { instanceId })
    }
    if (tenantId) {
      queryBuilder.andWhere('state.tenantId = :tenantId', { tenantId })
    }
    if (machineName) {
      queryBuilder.andWhere('state.machineName = :machineName', { machineName })
    }

    return (
      (await queryBuilder
        .orderBy('state.updatedAt', 'DESC')
        .getMany()
        .then((entities) => entities.map(MachineStateStore.machineInfoFrom))) ?? []
    )
  }

  async findMachineStates(args?: StoreFindMachineStatesArgs): Promise<Array<StoreMachineStateInfo>> {
    const connection: DataSource = await this._dbConnection
    debug('findMachineStates', args)
    const result: Array<MachineStateInfoEntity> = await connection.getRepository(MachineStateInfoEntity).find({
      ...(args?.filter && { where: args?.filter }),
      transaction: false,
    })

    return result.map((event: MachineStateInfoEntity) => MachineStateStore.machineInfoFrom(event))
  }

  async getMachineState(args: StoreMachineStateGetArgs): Promise<StoreMachineStateInfo> {
    const connection: DataSource = await this._dbConnection
    debug('getMachineState', args)
    return connection.getRepository(MachineStateInfoEntity).findOneOrFail({ where: { instanceId: args.instanceId } })
  }

  async deleteMachineState(args: StoreMachineStateDeleteArgs): Promise<boolean> {
    debug(`Executing deleteMachineState query with id: ${args.instanceId}`)
    if (!args.instanceId) {
      throw new Error('No instanceId parameter is provided.')
    }
    try {
      const connection: DataSource = await this._dbConnection

      const result = await connection.getRepository(MachineStateInfoEntity).delete(args.instanceId)
      return result.affected != null && result.affected > 0
    } catch (error) {
      debug(`Error deleting state: ${error}`)
      return false
    }
  }

  async deleteExpiredMachineStates(args: StoreMachineStateDeleteExpiredArgs): Promise<number> {
    const { machineName, tenantId, deleteDoneStates } = args
    debug(`Executing deleteExpiredMachineStates query with params: ${JSON.stringify(args)}`)
    try {
      const connection: DataSource = await this._dbConnection

      const deleteCriteria: FindOptionsWhere<MachineStateInfoEntity> = {
        ...(machineName && { machineName }),
        ...(tenantId && { tenantId }),
        // When deleteOnDone state is set we only look at completedAt, in other cases we compare current time with expiresAt
        ...(!deleteDoneStates && { expiresAt: LessThan(new Date()) }),
        ...(deleteDoneStates && { completedAt: Not(IsNull()) }),
      }
      const result = await connection.getRepository(MachineStateInfoEntity).delete(deleteCriteria)
      return result.affected ?? 0
    } catch (error) {
      debug(`Error deleting machine info: ${error}`)
      return Promise.reject(new Error(`Error deleting expired machine states for machine type ${machineName}`))
    }
  }

  protected static machineInfoFrom = (machineStateInfoEntity: MachineStateInfoEntity): StoreMachineStateInfo => {
    // We are making sure no entity function get copied
    return JSON.parse(JSON.stringify(machineStateInfoEntity))
  }

  static machineStateInfoEntityFrom = (machineStateInfo: StoreMachineStateInfo | StoreMachineStatePersistArgs): MachineStateInfoEntity => {
    const entity = new MachineStateInfoEntity()
    Object.assign(entity, machineStateInfo)
    return entity
  }
}
