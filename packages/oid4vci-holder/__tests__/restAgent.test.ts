import 'cross-fetch/polyfill'
// @ts-ignore
import express, { Router } from 'express'
import { Server } from 'http'
import { createAgent, IAgent, IAgentOptions } from '@veramo/core'
import { AgentRestClient } from '@veramo/remote-client'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'
import { createObjects, getConfig } from '../../agent-config/dist'
import oid4vciHolderAgentLogic from './shared/oid4vciHolderLogicAgentLogic'
import { IOID4VCIHolder } from '../src'
import { IMachineStatePersistence } from '@sphereon/ssi-sdk.xstate-machine-persistence'

jest.setTimeout(60000)

const port = 3051
const basePath = '/agent'

let serverAgent: IAgent
let restServer: Server

const getAgent = (options?: IAgentOptions) =>
  createAgent<IOID4VCIHolder & IMachineStatePersistence>({
    ...options,
    plugins: [
      new AgentRestClient({
        url: 'http://localhost:' + port + basePath,
        enabledMethods: serverAgent.availableMethods(),
        schema: serverAgent.getSchema(),
      }),
    ],
  })

const setup = async (): Promise<boolean> => {
  const config = await getConfig('packages/oid4vci-holder/agent.yml')
  const { agent } = await createObjects(config, { agent: '/agent' })
  serverAgent = agent

  const agentRouter: Router = AgentRouter({
    exposedMethods: serverAgent.availableMethods(),
  })

  const requestWithAgent: Router = RequestWithAgentRouter({
    agent: serverAgent,
  })

  return new Promise((resolve): void => {
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

const testContext = {
  getAgent,
  setup,
  tearDown,
}

describe('REST integration tests', (): void => {
  oid4vciHolderAgentLogic(testContext)
})
