import { getConfig } from '@veramo/cli/build/setup'
import { createObjects } from '@veramo/cli/build/lib/objectCreator'
import wellKnownDidIssuerAgentLogic from './shared/wellKnownDidIssuerAgentLogic'

jest.setTimeout(30000)

let agent: any

const setup = async (): Promise<boolean> => {
  const config = getConfig('packages/wellknown-did-issuer/agent.yml')
  const { localAgent } = createObjects(config, { localAgent: '/agent' })

  localAgent.didManagerGet = jest.fn().mockReturnValue(Promise.resolve({
    did: 'did:key:abc',
    services: [{
      id: 'did:key:abc',
      type: 'LinkedDomains',
      serviceEndpoint: 'https://example.com'
    }]
  }))

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
  isRestTest: false,
}

describe('Local integration tests', () => {
  wellKnownDidIssuerAgentLogic(testContext)
})
