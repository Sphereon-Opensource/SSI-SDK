import { getConfig } from '@veramo/cli/build/setup'
import { createObjects } from '@veramo/cli/build/lib/objectCreator'
import msVcApiIssuerAgentLogic from './shared/msVcApiIssuerAgentLogic'

jest.setTimeout(30000)

let agent: any

const setup = async (): Promise<boolean> => {
  const config = getConfig('packages/ms-vc-api-issuer/agent.yml')
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
  msVcApiIssuerAgentLogic(testContext)
})
