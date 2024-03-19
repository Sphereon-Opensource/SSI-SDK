import { DataSource } from 'typeorm'
import { createObjects, getConfig } from '@sphereon/ssi-sdk.agent-config'

import machineStatePersistenceAgentLogic from './shared/MachineStatePersistenceAgentLogic'

let dbConnection: Promise<DataSource>
let agent: any

const setup = async (): Promise<boolean> => {
  const config = await getConfig('packages/xstate-persistence/agent.yml')
  const { localAgent, db } = await createObjects(config, { localAgent: '/agent', db: '/dbConnection' })
  agent = localAgent
  dbConnection = db

  return true
}

const tearDown = async (): Promise<boolean> => {
  await (await dbConnection).destroy()
  return true
}

const getAgent = () => agent
const testContext = {
  getAgent,
  setup,
  tearDown,
}

describe('Local integration tests', (): void => {
  machineStatePersistenceAgentLogic(testContext)
})
