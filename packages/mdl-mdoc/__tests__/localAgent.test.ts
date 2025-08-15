import { createObjects, getConfig } from '../../agent-config/dist'
import { DataSource } from 'typeorm'

//jest.setTimeout(60000)
import mdlMdocLogic from './shared/mdlMdocAgentLogic'

let dbConnection: Promise<DataSource>
let agent: any

import { describe } from 'vitest'

const setup = async (): Promise<boolean> => {
  const config = await getConfig('packages/mdl-mdoc/agent.yml')
  const { localAgent, db } = await createObjects(config, { localAgent: '/agent', db: '/dbConnection' })
  agent = localAgent
  dbConnection = db

  return true
}

const tearDown = async (): Promise<boolean> => {
  await (await dbConnection)?.close()
  return true
}

const getAgent = () => agent
const testContext = {
  getAgent,
  setup,
  tearDown,
}

// FIXME Needs fixing after move to ESM, loading from config does not work anymore
describe.skip('Local integration tests', (): void => {
  mdlMdocLogic(testContext)
})
