import { createObjects, getConfig } from '../../agent-config/dist'
import { DataSource } from 'typeorm'

jest.setTimeout(60000)

import credentialManagerAgentLogic from './shared/credentialManagerAgentLogic'

let dbConnection: Promise<DataSource>
let agent: any

const setup = async (): Promise<boolean> => {
  const config = await getConfig('packages/credential-manager/agent.yml')
  const { localAgent, db } = await createObjects(config, { localAgent: '/agent', db: '/dbConnection' })
  agent = localAgent
  dbConnection = db

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
  tearDown,
}

describe('Local integration tests', (): void => {
  credentialManagerAgentLogic(testContext)
})
