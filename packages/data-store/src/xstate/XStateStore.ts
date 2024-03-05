import { OrPromise } from '@sphereon/ssi-types'
import Debug from 'debug'
import { Brackets, DataSource, FindOptionsWhere, LessThan } from 'typeorm'

import { StateEntity } from '../entities/xstate/StateEntity'
import { DeleteExpiredStateArgs, DeleteStateArgs, GetActiveStateArgs, GetStatesArgs, SaveStateArgs, State } from '../types'
import { IAbstractXStateStore } from './IAbstractXStateStore'

const debug = Debug('sphereon:ssi-sdk:xstate')

export class XStateStore extends IAbstractXStateStore {
  private readonly dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    super()
    this.dbConnection = dbConnection
  }

  async saveState(state: SaveStateArgs): Promise<State> {
    const connection: DataSource = await this.dbConnection
    debug(`Executing saveState with state: ${JSON.stringify(state)}`)
    return connection.getRepository(StateEntity).save(XStateStore.stateEntityFrom(state))
  }

  async getActiveState(args: GetActiveStateArgs): Promise<State> {
    const { tenantId, machineType } = args
    const connection: DataSource = await this.dbConnection
    debug(`Executing getActiveState query with machineType: ${machineType}, tenantId: ${tenantId}`)

    const queryBuilder = connection
      .getRepository(StateEntity)
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
    if (machineType) {
      queryBuilder.andWhere('state.machineType = :machineType', { machineType })
    }

    const result = await queryBuilder.getOne()

    if (!result) {
      throw new Error(`No active state found for machineType: ${machineType}, tenantId: ${tenantId}`)
    }
    return XStateStore.stateFrom(result)
  }

  async getStates(args?: GetStatesArgs): Promise<Array<State>> {
    const connection: DataSource = await this.dbConnection
    debug('Getting states', args)
    const result: Array<StateEntity> = await connection.getRepository(StateEntity).find({
      ...(args?.filter && { where: args?.filter }),
    })

    return result.map((event: StateEntity) => XStateStore.stateFrom(event))
  }

  async deleteState(args: DeleteStateArgs): Promise<boolean> {
    if (!args.id) {
      throw new Error('No id parameter is provided.')
    }
    try {
      const connection: DataSource = await this.dbConnection
      debug(`Executing deleteState query with id: ${args.id}`)
      const result = await connection.getRepository(StateEntity).delete(args.id)
      return result.affected != null && result.affected > 0
    } catch (error) {
      debug(`Error deleting state: ${error}`)
      return false
    }
  }

  async deleteExpiredStates(args: DeleteExpiredStateArgs): Promise<boolean> {
    try {
      const connection: DataSource = await this.dbConnection
      debug(`Executing deleteExpiredStates query with params: ${JSON.stringify(args)}`)
      const deleteCriteria: FindOptionsWhere<StateEntity> = { expiresAt: LessThan(new Date()), ...(args.machineType && { type: args.machineType }) }
      const result = await connection.getRepository(StateEntity).delete(deleteCriteria)
      return result.affected != null && result.affected > 0
    } catch (error) {
      debug(`Error deleting state: ${error}`)
      return false
    }
  }

  public static stateFrom = (stateEntity: StateEntity): State => {
    return {
      ...stateEntity,
      state: JSON.parse(stateEntity.state),
    }
  }

  public static stateEntityFrom = (state: State | SaveStateArgs): StateEntity => {
    const entity = new StateEntity()
    Object.assign(entity, state)
    entity.state = JSON.stringify(state.state)
    return entity
  }
}
