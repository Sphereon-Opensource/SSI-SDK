/**
 * @jest-environment jsdom
 */

import { createObjects, getConfig } from '@sphereon/ssi-sdk.agent-config'
import ssiQrCodeProviderLogic from './shared/ssiQrCodeProviderLogic'
import { describe } from 'vitest'

let agent: any

const setup = async (): Promise<boolean> => {
  const config = await getConfig('packages/qr-code-generator/__tests__/agent.yml')
  const { localAgent } = await createObjects(config, { localAgent: '/agent' })
  agent = localAgent

  return true
}

const tearDown = async (): Promise<void> => {}

const getAgent = () => agent
const testContext = { getAgent, setup, tearDown }

describe('Local integration tests', () => {
  ssiQrCodeProviderLogic(testContext)
})
