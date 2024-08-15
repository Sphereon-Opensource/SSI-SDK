import 'cross-fetch/polyfill'
import { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { IJwtService } from '@sphereon/ssi-sdk-ext.jwt-service'
// @ts-ignore
import express, { Router } from 'express'
import { Server } from 'http'
import { DataSource } from 'typeorm'
import { createAgent, IAgent, IAgentOptions, IDIDManager, IKeyManager } from '@veramo/core'
import { AgentRestClient } from '@veramo/remote-client'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'
import { createObjects, getConfig } from '../../agent-config/src'
import authClientAgentLogic from './shared/ebsiAuthorizationClientAgentLogic'
import { IEbsiSupport } from '../src'
import { IDidAuthSiopOpAuthenticator } from '@sphereon/ssi-sdk.siopv2-oid4vp-op-auth'

jest.setTimeout(60000)

const port = 4002
const basePath = '/agent'

let serverAgent: IAgent
let restServer: Server
let dbConnection: Promise<DataSource>

const getAgent = (options?: IAgentOptions) =>
  createAgent<IKeyManager & IDIDManager & IDidAuthSiopOpAuthenticator & IIdentifierResolution & IJwtService & IEbsiSupport>({
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
  const config = await getConfig('packages/ebsi-support/agent.yml')
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

describe('REST integration tests', (): void => {
  authClientAgentLogic(testContext)
})
