import 'cross-fetch/polyfill'
import { createAgent, IAgent, IAgentOptions, IDIDManager, IKeyManager } from '@veramo/core'
import { AgentRestClient } from '@veramo/remote-client'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'
// @ts-ignore
import express, { Router } from 'express'
import { Server } from 'http'
import { DataSource } from 'typeorm'
import { createObjects, getConfig } from '../../agent-config/src'
import { ImDLMdoc } from '../src'
import authClientAgentLogic from './shared/mdlMdocAgentLogic'

jest.setTimeout(15000)

const port = 4002
const basePath = '/agent'

let serverAgent: IAgent
let restServer: Server
let dbConnection: Promise<DataSource>

const getAgent = (options?: IAgentOptions) =>
  createAgent<IKeyManager & IDIDManager & ImDLMdoc>({
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
  const config = await getConfig('packages/mdl-mdoc/agent.yml')
  const { agent, db } = await createObjects(config, { agent: '/agent', db: '/dbConnection' })
  serverAgent = agent
  dbConnection = db

  const agentRouter = AgentRouter({
    exposedMethods: serverAgent.availableMethods(),
  })

  const requestWithAgent: Router = RequestWithAgentRouter({
    agent: serverAgent,
  })

  return new Promise((resolve): void => {
    const app = express()
    app.use(basePath, requestWithAgent, agentRouter)
    restServer = app.listen(port, (): void => {
      resolve(true)
    })
  })
}

const tearDown = async (): Promise<boolean> => {
  restServer.close()
  await (await dbConnection).close()
  return true
}

const testContext = {
  getAgent,
  setup,
  tearDown,
}

// We need to solve functions not being available after deserialization
xdescribe('REST integration tests', (): void => {
  authClientAgentLogic(testContext)
})
