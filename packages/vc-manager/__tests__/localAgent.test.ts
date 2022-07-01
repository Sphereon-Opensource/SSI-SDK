import { createAgent } from '@veramo/core'
import { DataStore, DataStoreORM, Entities } from '@veramo/data-store'
import { Connection, createConnection } from 'typeorm'
import { VcManager } from '../src'

jest.setTimeout(30000)

import vcManagerAgentLogic from './shared/vcManagerAgentLogic'
import { IVcManager } from '../src/types/IVcManager'

let dbConnection: Promise<Connection>
let agent: any

const setup = async (): Promise<boolean> => {
  dbConnection = createConnection({
    type: 'sqlite',
    database: ':memory:',
    synchronize: true,
    logging: false,
    entities: Entities,
  })
  const dataStore = new DataStore(dbConnection);
  const dataStoreORM = new DataStoreORM(dbConnection);
  const localAgent = createAgent<IVcManager>({
    plugins: [
      new VcManager({ dataStore, dataStoreORM}),
    ],
  })
  agent = localAgent
  return true
}

const tearDown = async (): Promise<boolean> => {
  await (await dbConnection).close()
  return true
}

const getAgent = () => agent
const testContext = {
  getAgent,
  setup,
  tearDown
}

describe('vc-manager Local integration tests', () => {
  vcManagerAgentLogic(testContext)
})
