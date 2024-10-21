import {createAgent} from '@veramo/core'
import oidfClientAgentLogic from './shared/oidfClientAgentLogic'
import {IOIDFClient, OIDFClient} from "../src";
import {CryptoPlatformTestCallback} from "./shared/CryptoPlatformTestCallback";

jest.setTimeout(60000)

let agent: any

const setup = async (): Promise<boolean> => {
  //const config = await getConfig('packages/oidf-client/agent.yml')
  //const { localAgent } = await createObjects(config, { localAgent: '/agent' })
  agent = createAgent<IOIDFClient>({
    plugins: [
        new OIDFClient({
          cryptoServiceCallback: new CryptoPlatformTestCallback()
        })
    ]
  })

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
