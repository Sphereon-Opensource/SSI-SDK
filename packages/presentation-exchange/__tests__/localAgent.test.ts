import * as fs from 'fs'
import { getConfig } from '@veramo/cli/build/setup'
import { createObjects } from '@veramo/cli/build/lib/objectCreator'
import presentationExchangeAgentLogic from './shared/presentationExchangeAgentLogic'

jest.setTimeout(30000)

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
  const config = getConfig('packages/presentation-exchange/agent.yml')
  // config.agent.$args[0].plugins[1].$args[0] = presentationSignCallback
  const { localAgent } = createObjects(config, { localAgent: '/agent' })
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
