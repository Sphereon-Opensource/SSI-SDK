import {getConfig} from '@veramo/cli/build/setup'
import {createObjects} from '@veramo/cli/build/lib/objectCreator'

jest.setTimeout(30000)

import SsiQrCodeProviderLogic from './shared/ssi-qr-code-provider-logic'

let agent: any

const setup = async (): Promise<boolean> => {
  const config = getConfig('packages/waci-pex/__tests__/agent.yml')
  const {localAgent} = createObjects(config, {localAgent: '/agent'})
  agent = localAgent

  return true
}

const tearDown = async (): Promise<boolean> => {
  return true
}

const getAgent = () => agent
const testContext = {getAgent, setup, tearDown}

describe('Local integration tests', () => {
  SsiQrCodeProviderLogic(testContext)
})
