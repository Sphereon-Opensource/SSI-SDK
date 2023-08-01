import { DataSource } from 'typeorm'
import { createObjects, getConfig } from '../../agent-config/dist'

import issuanceBrandingAgentLogic from './shared/issuanceBrandingAgentLogic'
import { describe } from 'vitest'

let dbConnection: Promise<DataSource>
let agent: any

const setup = async (): Promise<boolean> => {
  const config = await getConfig('packages/issuance-branding/agent.yml')
  const { localAgent, db } = await createObjects(config, { localAgent: '/agent', db: '/dbConnection' })
  agent = localAgent
  dbConnection = db

  return true
}

const tearDown = async (): Promise<void> => {
  await (await dbConnection).destroy()
}

const getAgent = () => agent
const testContext = {
  getAgent,
  setup,
  tearDown,
}

describe('Local integration tests', () => {
  issuanceBrandingAgentLogic(testContext)
})
