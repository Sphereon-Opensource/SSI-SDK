import { createObjects, getConfig } from '../../agent-config/dist'
import { DataSource } from 'typeorm'

import { describe } from 'vitest'
//jest.setTimeout(60000)
import anomalyDetectionAgentLogic from './shared/anomalyDetectionAgentLogic'

let dbConnection: Promise<DataSource>
let agent: any

const setup = async (): Promise<boolean> => {
  const config = await getConfig('packages/anomaly-detection/agent.yml')
  config.agent.$args[0].plugins[0].$args[0].geoIpDB.$args[0].path = process.env.GEO_IP_DB_PATH
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
  anomalyDetectionAgentLogic(testContext)
})
