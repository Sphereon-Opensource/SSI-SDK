import { createObjects, getConfig } from '../../agent-config/src'
import { describe } from 'vitest'
import kmsRestClientAgentLogic from './shared/kmsRestClientAgentLogic'
import { createMocks } from './shared/mocks'

let agent: any

const setup = async (): Promise<boolean> => {
  const config = await getConfig('packages/kms-rest-client/agent.yml')
  const { localAgent } = await createObjects(config, { localAgent: '/agent' })
  agent = localAgent

  createMocks()

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
  kmsRestClientAgentLogic(testContext)
})
