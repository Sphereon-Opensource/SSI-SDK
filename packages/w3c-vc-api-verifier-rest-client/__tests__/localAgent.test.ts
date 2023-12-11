import { getConfig } from '@veramo/cli/build/setup'
import { createObjects } from '@veramo/cli/build/lib/objectCreator'

jest.setTimeout(60000)

import vcApiVerifierAgentLogic from './shared/vcApiVerifierAgentLogic'

let agent: any

const setup = async (): Promise<boolean> => {
  const config = getConfig('packages/w3c-vc-api-verifier-rest-client/agent.yml')
  const { localAgent } = createObjects(config, { localAgent: '/agent' })
  agent = localAgent

  return true
}

const tearDown = async (): Promise<boolean> => {
  return true
}

const getAgent = () => agent
const testContext = { getAgent, setup, tearDown }

describe('Local integration tests', () => {
  vcApiVerifierAgentLogic(testContext)
})
