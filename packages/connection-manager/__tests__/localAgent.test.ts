import fs from 'fs'
import { getConfig } from '@veramo/cli/build/setup'
import { createObjects } from '@veramo/cli/build/lib/objectCreator'
import { Connection } from 'typeorm'

jest.setTimeout(30000)

import connectionManagerAgentLogic from './shared/connectionManagerAgentLogic'

let dbConnection: Promise<Connection>
let agent: any

const setup = async (): Promise<boolean> => {
  const config = getConfig('packages/connection-manager/agent.yml')
  const { localAgent, db } = createObjects(config, { localAgent: '/agent', db: '/dbConnection' })
  agent = localAgent
  dbConnection = db

  return true
}

const tearDown = async (): Promise<boolean> => {
  await (await dbConnection).close()
  fs.unlinkSync('packages/connection-manager/database.sqlite')
  return true
}

const getAgent = () => agent
const testContext = {
  getAgent,
  setup,
  tearDown
}

describe('Local integration tests', () => {
  connectionManagerAgentLogic(testContext)
})
