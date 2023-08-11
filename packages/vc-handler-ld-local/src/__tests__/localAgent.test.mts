import { createObjects, getConfig } from '@sphereon/ssi-sdk.agent-config'

import { LdDefaultContexts } from '../ld-default-contexts.mjs'
import { SphereonEd25519Signature2018 } from '../suites/Ed25519Signature2018.mjs'
import { SphereonEd25519Signature2020 } from '../suites/Ed25519Signature2020.mjs'

import vcHandlerLocalAgentLogic from './shared/vcHandlerLocalAgentLogic.mjs'
import vcHandlerLocalAgentBbsLogic from './shared/vcHandlerLocalAgentBbsLogic.mjs'
import { SphereonBbsBlsSignature2020 } from '../suites/index.mjs'
import { describe, vi } from 'vitest'

let agent: any

const setup = async (): Promise<boolean> => {
  const config = await getConfig('packages/vc-handler-ld-local/agent.yml')
  config.agent.$args[0].plugins[1].$args[0].contextMaps = [LdDefaultContexts]
  config.agent.$args[0].plugins[1].$args[0].suites = [SphereonEd25519Signature2018, SphereonEd25519Signature2020, SphereonBbsBlsSignature2020]
  const { localAgent } = await createObjects(config, { localAgent: '/agent' })
  agent = localAgent
  agent.getSupportedVeramoKeyType = vi.fn()

  return true
}

const tearDown = async (): Promise<void> => {}

const testContext = { setup, tearDown }

describe('Local integration tests', () => {
  vcHandlerLocalAgentLogic(testContext)
  vcHandlerLocalAgentBbsLogic(testContext)
})
