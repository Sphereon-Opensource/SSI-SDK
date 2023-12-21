import { createObjects, getConfig } from '@sphereon/ssi-sdk.agent-config'
import msRequestApiAgentLogic from './shared/msRequestApiAgentLogic'

jest.setTimeout(60000)

let agent: any

const setup = async (): Promise<boolean> => {
  const config = await getConfig('packages/ms-request-api/agent.yml')
  const { localAgent } = await createObjects(config, { localAgent: '/agent' })
  agent = localAgent
  return true
}

const tearDown = async (): Promise<boolean> => {
  return true
}

const getAgent = () => agent
const testContext = { getAgent, setup, tearDown }

xdescribe('Local integration tests', () => {
  msRequestApiAgentLogic(testContext)
})
