import { getConfig } from '@veramo/cli/build/setup'
import { createObjects } from '@veramo/cli/build/lib/objectCreator'

jest.setTimeout(30000)

import vcApiIssuerAgentLogic from './shared/vcApiIssuerAgentLogic'
import { ContextDoc, LdDefaultContexts, VeramoEd25519Signature2018 } from '@veramo/credential-ld'

let agent: any

const setup = async (): Promise<boolean> => {
  const config = getConfig('packages/vc-handler-ld-local/agent.yml')
  console.log(JSON.stringify(config.agent.$args[0], null, 1))
  config.agent.$args[0].plugins[1].$args[0].contextMaps = [LdDefaultContexts]
  config.agent.$args[0].plugins[1].$args[0].suites = [VeramoEd25519Signature2018]
  // config.agent.$args[0].plugins[0].$args[0].bindingOverrides = []
  // config.agent.$args[0].plugins[2].$args[0].contextMaps = [LdDefaultContexts]
  // config.agent.$args[0].plugins[2].$args[0].suites = [VeramoEd25519Signature2018]
  // config.agent.$args[0].plugins[2].$args[0].bindingOverrides = []
  const { localAgent } = createObjects(config, { localAgent: '/agent' })
  agent = localAgent
  agent.getSupportedVeramoKeyType = jest.fn()

  return true
}

const tearDown = async (): Promise<boolean> => {
  return true
}

const testContext = { setup, tearDown }

describe('Local integration tests', () => {
  vcApiIssuerAgentLogic(testContext)
})
