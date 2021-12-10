import 'cross-fetch/polyfill'
import { IAgent, IAgentOptions } from '@veramo/core'
import express from 'express'
import { Server } from 'http'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'
import { getConfig } from '@veramo/cli/build/setup'
import { createObjects } from '@veramo/cli/build/lib/objectCreator'
import vcHandlerLocalAgentLogic from './shared/vcHandlerLocalAgentLogic'
import { ICredentialHandlerLDLocal } from '../types/ICredentialHandlerLDLocal'
import { CredentialHandlerLDLocal } from '../agent/CredentialHandlerLDLocal'
import { LdDefaultContexts } from '../ld-default-contexts'
import { SphereonEd25519Signature2018 } from '../suites/Ed25519Signature2018'
import { SphereonEd25519Signature2020 } from '../suites/Ed25519Signature2020'

jest.setTimeout(30000)

const port = 4002
const basePath = '/agent'
let serverAgent: IAgent
let restServer: Server

if (!process.env.VC_HTTP_API_AUTH_TOKEN) {
  jest.clearAllTimers()
  throw new Error('Authorization token must be provided')
}

const setup = async (): Promise<boolean> => {
  const config = getConfig('packages/vc-handler-ld-local/agent.yml')
  ;(config.agent.$args[0].plugins[0].$args[0].contextMaps = [LdDefaultContexts /*, customContext*/]),
    (config.agent.$args[0].plugins[0].$args[0].suites = [new SphereonEd25519Signature2018(), new SphereonEd25519Signature2020()])
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
  restServer?.close()
  return true
}

const testContext = { setup, tearDown }

describe('REST integration tests', () => {
  vcHandlerLocalAgentLogic(testContext)
})
