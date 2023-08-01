import { createObjects, getConfig } from '../../agent-config/dist'
import { Connection } from 'typeorm'

import { describe } from 'vitest'

import contactManagerAgentLogic from './shared/contactManagerAgentLogic'

let dbConnection: Promise<Connection>
let agent: any

const setup = async (): Promise<boolean> => {
  const config = await getConfig('packages/contact-manager/agent.yml')
  const { localAgent, db } = await createObjects(config, { localAgent: '/agent', db: '/dbConnection' })
  agent = localAgent
  dbConnection = db

  return true
}

const tearDown = async (): Promise<void> => {
  await (await dbConnection).close()
}

const getAgent = () => agent
const testContext = {
  getAgent,
  setup,
  tearDown,
}

describe('Local integration tests', () => {
  contactManagerAgentLogic(testContext)
})
