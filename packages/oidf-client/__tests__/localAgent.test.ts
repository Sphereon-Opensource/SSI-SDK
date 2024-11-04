import oidfClientAgentLogic from './shared/oidfClientAgentLogic'
import { getConfig, createObjects } from '@sphereon/ssi-sdk.agent-config'

jest.setTimeout(60000)

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

describe.skip('Local integration tests', (): void => {
  oidfClientAgentLogic(testContext)
})
