import { createObjects, getConfig } from '@sphereon/ssi-sdk.agent-config'

jest.setTimeout(60000)

import { LdDefaultContexts } from '../ld-default-contexts'
import { SphereonEd25519Signature2018, SphereonEd25519Signature2020 } from '../suites'

import vcHandlerLocalAgentLogic from './shared/vcHandlerLocalAgentLogic'

let agent: any

const setup = async (): Promise<boolean> => {
  const config = await getConfig('packages/vc-handler-ld-local/agent.yml')
  config.agent.$args[0].plugins[1].$args[0].contextMaps = [LdDefaultContexts]
  config.agent.$args[0].plugins[1].$args[0].suites = [SphereonEd25519Signature2018, SphereonEd25519Signature2020]
  const { localAgent } = await createObjects(config, { localAgent: '/agent' })
  agent = localAgent
  agent.getSupportedVeramoKeyType = jest.fn()
  jest.setTimeout(100000)

  return true
}

const tearDown = async (): Promise<boolean> => {
  return true
}

const testContext = { setup, tearDown }

describe('Local integration tests', () => {
  vcHandlerLocalAgentLogic(testContext)
})
