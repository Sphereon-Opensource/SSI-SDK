import { createObjects, getConfig } from '@sphereon/ssi-sdk.agent-config'
import msRequestApiAgentLogic from './shared/msRequestApiAgentLogic.mjs'
import { describe, it, expect } from 'vitest'

let agent: any

const setup = async (): Promise<boolean> => {
  const config = await getConfig('packages/ms-request-api/agent.yml')
  const { localAgent } = await createObjects(config, { localAgent: '/agent' })
  agent = localAgent
  return true
}

const tearDown = async (): Promise<void> => {}

const getAgent = () => agent
const testContext = { getAgent, setup, tearDown }

describe.skip('Local integration tests', () => {
  msRequestApiAgentLogic(testContext)
})
