import { OrPromise } from '@sphereon/ssi-types'
import Debug from 'debug'
import { Brackets, DataSource, FindOptionsWhere, LessThan } from 'typeorm'

import { MachineStateInfoEntity } from '../entities/machineState/MachineStateInfoEntity'
import {
  StoreMachineStateDeleteExpiredArgs,
  StoreMachineStateDeleteArgs,
  StoreMachineStatesFindActiveArgs,
  StoreFindMachineStatesArgs,
  StoreMachineStatePersistArgs,
  StoreMachineStateInfo,
  StoreMachineStateGetArgs,
} from '../types'
import { IAbstractMachineStateStore } from './IAbstractMachineStateStore'

const debug = Debug('sphereon:ssi-sdk:machine-state:store')

export class MachineStateStore extends IAbstractMachineStateStore {
  private readonly _dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    super()
    this._dbConnection = dbConnection
  }

  async persistMachineState(state: StoreMachineStatePersistArgs): Promise<StoreMachineStateInfo> {
    const connection: DataSource = await this._dbConnection
    debug(`Executing persistMachineState with state: ${JSON.stringify(state)}`)
    const entity = MachineStateStore.machineStateInfoEntityFrom(state)
    const result = await connection.getRepository(MachineStateInfoEntity).save(entity)
    return MachineStateStore.machineInfoFrom(result)
  }

  async findActiveMachineStates(args: StoreMachineStatesFindActiveArgs): Promise<Array<StoreMachineStateInfo>> {
    const { tenantId, machineName, sessionId } = args
    const connection: DataSource = await this._dbConnection
    debug(`Executing findActiveMachineStates query with machineName: ${machineName}, tenantId: ${tenantId}`)

    const queryBuilder = connection
      .getRepository(MachineStateInfoEntity)
      .createQueryBuilder('state')
      .where('state.completedAt IS NULL')
      .andWhere(
        new Brackets((qb) => {
          qb.where('state.expiresAt IS NULL').orWhere('state.expiresAt > :now', { now: new Date() })
        })
      )

    if (tenantId) {
      queryBuilder.andWhere('state.tenantId = :tenantId', { tenantId })
    }
    if (machineName) {
      queryBuilder.andWhere('state.machineName = :machineName', { machineName })
    }
    if (sessionId) {
      queryBuilder.andWhere('state.sessionId = :sessionId', { sessionId })
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
    })

    return result.map((event: MachineStateInfoEntity) => MachineStateStore.machineInfoFrom(event))
  }

  async getMachineState(args: StoreMachineStateGetArgs): Promise<StoreMachineStateInfo> {
    const connection: DataSource = await this._dbConnection
    debug('getMachineState', args)
    return connection.getRepository(MachineStateInfoEntity).findOneOrFail({ where: { instanceId: args.id } })
  }

  async deleteMachineState(args: StoreMachineStateDeleteArgs): Promise<boolean> {
    debug(`Executing deleteMachineState query with id: ${args.id}`)
    if (!args.id) {
      throw new Error('No instanceId parameter is provided.')
    }
    try {
      const connection: DataSource = await this._dbConnection

      const result = await connection.getRepository(MachineStateInfoEntity).delete(args.id)
      return result.affected != null && result.affected > 0
    } catch (error) {
      debug(`Error deleting state: ${error}`)
      return false
    }
  }

  async deleteExpiredMachineStates(args: StoreMachineStateDeleteExpiredArgs): Promise<boolean> {
    debug(`Executing deleteExpiredMachineStates query with params: ${JSON.stringify(args)}`)
    try {
      const connection: DataSource = await this._dbConnection
      const deleteCriteria: FindOptionsWhere<MachineStateInfoEntity> = {
        expiresAt: LessThan(new Date()),
        ...(args.machineName && { type: args.machineName }),
      }
      const result = await connection.getRepository(MachineStateInfoEntity).delete(deleteCriteria)
      return result.affected != null && result.affected > 0
    } catch (error) {
      debug(`Error deleting machine info: ${error}`)
      return false
    }
  }

  protected static machineInfoFrom = (machineStateInfoEntity: MachineStateInfoEntity): StoreMachineStateInfo => {
    // We are making sure no entity function get copied
    return { ...machineStateInfoEntity }
    /*const info = {} as StoreMachineStateInfo
    Object.assign(info, machineStateInfoEntity)
    return info*/
  }

  static machineStateInfoEntityFrom = (machineStateInfo: StoreMachineStateInfo | StoreMachineStatePersistArgs): MachineStateInfoEntity => {
    const entity = new MachineStateInfoEntity()
    Object.assign(entity, machineStateInfo)
    return entity
  }
}
