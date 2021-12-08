import 'cross-fetch/polyfill'
import { IAgent, createAgent, IAgentOptions } from '@veramo/core'
import { AgentRestClient } from '@veramo/remote-client'
import { Server } from 'http'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'
import { getConfig } from '@veramo/cli/build/setup'
import { createObjects } from '@veramo/cli/build/lib/objectCreator'
import { IQRCodeCreator, QRCodeCreator } from '../src'
import qrCodeCreatorAgentLogic from './shared/qrCodeCreatorAgentLogic'

jest.setTimeout(30000)

const port = 3002
const basePath = '/agent'
let serverAgent: IAgent
let restServer: Server

if (!process.env.VC_HTTP_API_AUTH_TOKEN) {
  jest.clearAllTimers()
  throw new Error('Authorization token must be provided')
}

const getAgent = (options?: IAgentOptions) =>
  createAgent<IQRCodeCreator>({
    ...options,
    plugins: [
      new QRCodeCreator(),
      new AgentRestClient({
        url: 'http://localhost:' + port + basePath,
        enabledMethods: serverAgent.availableMethods(),
        schema: serverAgent.getSchema(),
      }),
    ],
  })

const setup = async (): Promise<boolean> => {
  const config = getConfig('packages/waci-pex/agent.yml')
  const { agent } = createObjects(config, { agent: '/agent' })
  serverAgent = agent

  const agentRouter = AgentRouter({
    exposedMethods: serverAgent.availableMethods(),
  })

  const requestWithAgent = RequestWithAgentRouter({
    agent: serverAgent,
  })

  return new Promise((resolve) => {
    const app = express()
    app.use(basePath, requestWithAgent, agentRouter)
    restServer = app.listen(port, () => {
      resolve(true)
    })
  })
}

const tearDown = async (): Promise<boolean> => {
  restServer.close()
  return true
}

const testContext = { getAgent, setup, tearDown }

describe('REST integration tests', () => {
  qrCodeCreatorAgentLogic(testContext)
})
