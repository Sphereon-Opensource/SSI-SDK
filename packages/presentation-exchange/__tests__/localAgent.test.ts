import * as fs from 'fs'
import { createObjects, getConfig } from '@sphereon/ssi-sdk.agent-config'
import presentationExchangeAgentLogic from './shared/presentationExchangeAgentLogic'

jest.setTimeout(60000)

function getFile(path: string) {
  return fs.readFileSync(path, 'utf-8')
}

export function getFileAsJson(path: string) {
  return JSON.parse(getFile(path))
}

let agent: any

/*
const presentationSignCallback: PresentationSignCallback = async (args) => {
  const presentationSignProof = getFileAsJson('./packages/presentation-exchange/__tests__/vc_vp_examples/psc/psc.json')

  return {
    ...args.presentation,
    ...presentationSignProof,
  }
}
*/

const setup = async (): Promise<boolean> => {
  const config = await getConfig('packages/presentation-exchange/agent.yml')
  // config.agent.$args[0].plugins[1].$args[0] = presentationSignCallback
  const { localAgent } = await createObjects(config, { localAgent: '/agent' })
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
  presentationExchangeAgentLogic(testContext)
})
