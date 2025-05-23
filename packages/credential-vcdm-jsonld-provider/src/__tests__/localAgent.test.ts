import { describe, vi, vitest } from 'vitest'
import { createObjects, getConfig } from '@sphereon/ssi-sdk.agent-config'

//jest.setTimeout(60000)
import { LdDefaultContexts } from '../ld-default-contexts'
import { SphereonEcdsaSecp256k1RecoverySignature2020, SphereonEd25519Signature2018, SphereonEd25519Signature2020 } from '../suites'

import vcHandlerLocalAgentLogic from './shared/vcHandlerLocalAgentLogic'

let agent: any

const setup = async (): Promise<boolean> => {
  const config = await getConfig('packages/credential-vcdm-jsonld-provider/agent.yml')
  config.agent.$args[0].plugins[1].$args[0].contextMaps = [LdDefaultContexts]
  config.agent.$args[0].plugins[1].$args[0].suites = [
    SphereonEd25519Signature2018,
    SphereonEd25519Signature2020,
    SphereonEcdsaSecp256k1RecoverySignature2020,
  ]
  const { localAgent } = await createObjects(config, { localAgent: '/agent' })
  agent = localAgent
  agent.getSupportedVeramoKeyType = vitest.fn()
  //jest.setTimeout(100000)

  return true
}

const tearDown = async (): Promise<boolean> => {
  return true
}

const testContext = { setup, tearDown }

describe('Local integration tests', () => {
  vcHandlerLocalAgentLogic(testContext)
})
