import 'cross-fetch/polyfill'
import { IAgent, createAgent, IAgentOptions } from '@veramo/core'
import { AgentRestClient } from '@veramo/remote-client'
// @ts-ignore
import express from 'express'
import { Server } from 'http'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'
import { getConfig } from '@veramo/cli/build/setup'
import { createObjects } from '@veramo/cli/build/lib/objectCreator'
import { IVcApiVerifier, VcApiVerifier } from '../src'
import vcApiVerifierAgentLogic from './shared/vcApiVerifierAgentLogic'
import * as path from 'path'

jest.setTimeout(30000)

const port = 3003
const basePath = '/agent'
let serverAgent: IAgent
let restServer: Server

const getAgent = (options?: IAgentOptions) =>
  createAgent<IVcApiVerifier>({
    ...options,
    plugins: [
      new VcApiVerifier({
        verifyUrl: 'https://vc-api.sphereon.io/services/verify/credentials',
      }),
      new AgentRestClient({
        url: 'http://localhost:' + port + basePath,
        enabledMethods: serverAgent.availableMethods(),
        schema: serverAgent.getSchema(),
      }),
    ],
  })

const setup = async (): Promise<boolean> => {
  const config = getConfig(path.resolve('packages/vc-api-verifier/agent.yml'))
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
  vcApiVerifierAgentLogic(testContext)
})
