import { getConfig } from '@veramo/cli/build/setup'
import { createObjects } from '@veramo/cli/build/lib/objectCreator'

jest.setTimeout(30000)

import didAuthSiopOpAuthenticatorAgentLogic from './shared/didAuthSiopOpAuthenticatorAgentLogic'
import { PresentationSignCallback } from '@sphereon/did-auth-siop'

let agent: any

const presentationSignCallback: PresentationSignCallback = async (args) => ({
  ...args.presentation,
  proof: {
    type: 'RsaSignature2018',
    created: '2018-09-14T21:19:10Z',
    proofPurpose: 'authentication',
    verificationMethod: 'did:example:ebfeb1f712ebc6f1c276e12ec21#keys-1',
    challenge: '1f44d55f-f161-4938-a659-f8026467f126',
    domain: '4jt78h47fh47',
    jws: 'eyJhbGciOiJSUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..kTCYt5XsITJX1CxPCT8yAV-TVIw5WEuts01mq-pQy7UJiN5mgREEMGlv50aqzpqh4Qq_PbChOMqsLfRoPsnsgxD-WUcX16dUOqV0G_zS245-kronKb78cPktb3rk-BuQy72IFLN25DYuNzVBAh4vGHSrQyHUGlcTwLtjPAnKb78'
  }
})

const setup = async (): Promise<boolean> => {
  const config = getConfig('packages/did-auth-siop-op-authenticator/agent.yml')
  config.agent.$args[0].plugins[1].$args[0] = presentationSignCallback
  const { localAgent } = createObjects(config, { localAgent: '/agent' })
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
  didAuthSiopOpAuthenticatorAgentLogic(testContext)
})
