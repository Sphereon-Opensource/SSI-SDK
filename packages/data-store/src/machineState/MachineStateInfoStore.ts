import { OrPromise } from '@sphereon/ssi-types'
import Debug from 'debug'
import { Brackets, DataSource, FindOptionsWhere, LessThan } from 'typeorm'

import { MachineStateInfoEntity } from '../entities/machineState/MachineStateInfoEntity'
import {
  StoreDeleteExpiredMachineArgs,
  StoreDeleteMachineArgs,
  StoreFindActiveMachinesArgs,
  StoreFindMachinesArgs,
  StorePersistMachineArgs,
  StoreMachineStateInfo,
  StoreGetMachineArgs,
} from '../types'
import { IAbstractMachineStateInfoStore } from './IAbstractMachineStateInfoStore'

const debug = Debug('sphereon:ssi-sdk:machine-state-info-store')

export class MachineStateInfoStore extends IAbstractMachineStateInfoStore {
  private readonly _dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    super()
    this._dbConnection = dbConnection
  }

  async persistMachineState(state: StorePersistMachineArgs): Promise<StoreMachineStateInfo> {
    const connection: DataSource = await this._dbConnection
    debug(`Executing persistMachineState with state: ${JSON.stringify(state)}`)
    return connection.getRepository(MachineStateInfoEntity).save(MachineStateInfoStore.machineStateInfoEntityFrom(state))
  }

  async findActiveMachineStates(args: StoreFindActiveMachinesArgs): Promise<Array<StoreMachineStateInfo>> {
    const { tenantId, machineId } = args
    const connection: DataSource = await this._dbConnection
    debug(`Executing findActiveMachineStates query with machineId: ${machineId}, tenantId: ${tenantId}`)

    const queryBuilder = connection
      .getRepository(MachineStateInfoEntity)
      .createQueryBuilder('state')
      .where('state.completedAt IS NULL')
      .andWhere(
        new Brackets((qb) => {
          qb.where('state.expiresAt IS NULL').orWhere('state.expiresAt > :now', { now: new Date() })
        })
      )
      .orderBy('state.updatedAt', 'DESC')

    if (tenantId) {
      queryBuilder.andWhere('state.tenantId = :tenantId', { tenantId })
    }
    if (machineId) {
      queryBuilder.andWhere('state.machineId = :machineId', { machineId })
    }

    return (await queryBuilder.getMany().then((entities) => entities.map((entity) => MachineStateInfoStore.machineInfoFrom(entity)))) ?? []
  }

  async findMachineStates(args?: StoreFindMachinesArgs): Promise<Array<StoreMachineStateInfo>> {
    const connection: DataSource = await this._dbConnection
    debug('findMachineStates', args)
    const result: Array<MachineStateInfoEntity> = await connection.getRepository(MachineStateInfoEntity).find({
      ...(args?.filter && { where: args?.filter }),
    })

    return result.map((event: MachineStateInfoEntity) => MachineStateInfoStore.machineInfoFrom(event))
  }

  async getMachineState(args: StoreGetMachineArgs): Promise<StoreMachineStateInfo> {
    const connection: DataSource = await this._dbConnection
    debug('getMachineState', args)
    return connection.getRepository(MachineStateInfoEntity).findOneOrFail({ where: { id: args.id } })
  }

  async deleteMachineState(args: StoreDeleteMachineArgs): Promise<boolean> {
    debug(`Executing deleteMachineState query with id: ${args.id}`)
    if (!args.id) {
      throw new Error('No id parameter is provided.')
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

  async deleteExpiredMachineStates(args: StoreDeleteExpiredMachineArgs): Promise<boolean> {
    debug(`Executing deleteExpiredMachineStates query with params: ${JSON.stringify(args)}`)
    try {
      const connection: DataSource = await this._dbConnection
      const deleteCriteria: FindOptionsWhere<MachineStateInfoEntity> = {
        expiresAt: LessThan(new Date()),
        ...(args.machineId && { type: args.machineId }),
      }
      const result = await connection.getRepository(MachineStateInfoEntity).delete(deleteCriteria)
      return result.affected != null && result.affected > 0
    } catch (error) {
      debug(`Error deleting machine info: ${error}`)
      return false
    }
  }

  protected static machineInfoFrom = (MachineStateInfoEntity: MachineStateInfoEntity): StoreMachineStateInfo => {
    return {
      ...MachineStateInfoEntity,
      state: JSON.parse(MachineStateInfoEntity.state),
    }
  }

  static machineStateInfoEntityFrom = (machineStateInfo: StoreMachineStateInfo | StorePersistMachineArgs): MachineStateInfoEntity => {
    const entity = new MachineStateInfoEntity()
    Object.assign(entity, machineStateInfo)
    entity.state = JSON.stringify(machineStateInfo.state)
    return entity
  }
}
