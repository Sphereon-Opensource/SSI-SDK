import { createObjects, getConfig } from '../../agent-config/src'
import oid4vciHolderAgentLogic from './shared/oid4vciHolderLogicAgentLogic'

jest.setTimeout(60000)

let agent: any

const setup = async (): Promise<boolean> => {
  const config = await getConfig('packages/oid4vci-holder/agent.yml')
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

describe('Local integration tests', (): void => {
  oid4vciHolderAgentLogic(testContext)
})
