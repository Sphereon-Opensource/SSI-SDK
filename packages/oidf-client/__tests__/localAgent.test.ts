import oidfClientAgentLogic from './shared/oidfClientAgentLogic'
import {createObjects, getConfig} from '../../agent-config/dist'
import {com} from "@sphereon/openid-federation-client";
import {defaultCryptoJSImpl} from "./shared/CryptoDefaultCallback";
import DefaultCallbacks = com.sphereon.oid.fed.client.service.DefaultCallbacks;

jest.setTimeout(60000)

let agent: any

const setup = async (): Promise<boolean> => {
  DefaultCallbacks.setCryptoServiceDefault(defaultCryptoJSImpl)
  const config = await getConfig('packages/oidf-client/agent.yml')
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
}

describe('Local integration tests', (): void => {
  oidfClientAgentLogic(testContext)
})
