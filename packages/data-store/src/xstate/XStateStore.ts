import { OrPromise } from '@sphereon/ssi-types'
import Debug from 'debug'
import { DataSource, FindOptionsWhere, LessThan } from 'typeorm'

import { StateEntity } from '../entities/xstate/StateEntity'
import { DeleteExpiredStateArgs, DeleteStateArgs, GetStateArgs, GetStatesArgs, SaveStateArgs, State } from '../types'
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
    return connection.getRepository(StateEntity).save(state)
  }

  async getState(args: GetStateArgs): Promise<State> {
    const connection: DataSource = await this.dbConnection
    debug(`Executing loadState query with type: ${args.type}`)
    const result: StateEntity | null = await connection.getRepository(StateEntity).findOne({
      where: { type: args.type },
    })
    if (!result) {
      return Promise.reject(Error(`No state found for type: ${args.type}`))
    }
    return this.stateFrom(result)
  }

  async getStates(args?: GetStatesArgs): Promise<Array<State>> {
    const connection: DataSource = await this.dbConnection // TODO apply everywhere
    debug('Getting states', args)
    const result: Array<StateEntity> = await connection.getRepository(StateEntity).find({
      ...(args?.filter && { where: args?.filter }),
    })

    return result.map((event: StateEntity) => this.stateFrom(event))
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
      const deleteCriteria: FindOptionsWhere<StateEntity> = { expiresAt: LessThan(new Date()), ...(args.type && { type: args.type }) }
      const result = await connection.getRepository(StateEntity).delete(deleteCriteria)
      return result.affected != null && result.affected > 0
    } catch (error) {
      debug(`Error deleting state: ${error}`)
      return false
    }
  }

  private stateFrom = (state: StateEntity): State => {
    return {
      ...state,
    }
  }
}
