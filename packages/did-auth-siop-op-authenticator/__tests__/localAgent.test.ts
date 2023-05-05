import * as fs from 'fs'
import { createObjects, getConfig } from '@sphereon/ssi-sdk-agent-config'
import didAuthSiopOpAuthenticatorAgentLogic from './shared/didAuthSiopOpAuthenticatorAgentLogic'
import { PresentationSignCallback } from '@sphereon/did-auth-siop'

jest.setTimeout(30000)

function getFile(path: string) {
  return fs.readFileSync(path, 'utf-8')
}

function getFileAsJson(path: string) {
  return JSON.parse(getFile(path))
}

let agent: any

const presentationSignCallback: PresentationSignCallback = async (args) => {
  const presentationSignProof = getFileAsJson('./packages/did-auth-siop-op-authenticator/__tests__/vc_vp_examples/psc/psc.json')

  return {
    ...args.presentation,
    ...presentationSignProof,
  }
}

const setup = async (): Promise<boolean> => {
  const config = await getConfig('packages/did-auth-siop-op-authenticator/agent.yml')
  config.agent.$args[0].plugins[1].$args[0] = presentationSignCallback
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

xdescribe('Local integration tests', () => {
  didAuthSiopOpAuthenticatorAgentLogic(testContext)
})
