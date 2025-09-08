import oidfClientAgentLogic from './shared/oidfClientAgentLogic'
import { createObjects, getConfig } from '@sphereon/ssi-sdk.agent-config'
import { describe } from 'vitest'
//jest.setTimeout(60000)

let agent: any

const setup = async (): Promise<boolean> => {
  const config = await getConfig('packages/oidf-client/agent.yml')
  const { localAgent } = await createObjects(config, { localAgent: '/agent' })
  agent = localAgent

  return true
}

const tearDown = async (): Promise<boolean> => {
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
  oidfClientAgentLogic(testContext)
})
