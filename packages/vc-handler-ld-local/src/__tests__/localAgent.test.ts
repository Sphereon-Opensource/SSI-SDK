import { createObjects } from '@veramo/cli/build/lib/objectCreator'
import { getConfig } from '@veramo/cli/build/setup'

jest.setTimeout(30000)

import { LdDefaultContexts } from '../ld-default-contexts'
import { SphereonEd25519Signature2018 } from '../suites/Ed25519Signature2018'
import { SphereonEd25519Signature2020 } from '../suites/Ed25519Signature2020'

import vcHandlerLocalAgentLogic from './shared/vcHandlerLocalAgentLogic'
import vcHandlerLocalAgentBbsLogic from './shared/vcHandlerLocalAgentBbsLogic'
import { SphereonBbsBlsSignature2020 } from '../suites'

let agent: any

const setup = async (): Promise<boolean> => {
  const config = getConfig('packages/vc-handler-ld-local/agent.yml')
  console.log(JSON.stringify(config.agent.$args[0], null, 1))
  config.agent.$args[0].plugins[1].$args[0].contextMaps = [LdDefaultContexts]
  config.agent.$args[0].plugins[1].$args[0].suites = [SphereonEd25519Signature2018, SphereonEd25519Signature2020, SphereonBbsBlsSignature2020]
  const { localAgent } = createObjects(config, { localAgent: '/agent' })
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
  vcHandlerLocalAgentBbsLogic(testContext)
})
