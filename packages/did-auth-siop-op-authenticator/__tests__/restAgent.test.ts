import 'cross-fetch/polyfill'
// @ts-ignore
import express from 'express'
import { IAgent, createAgent, IAgentOptions, IDataStore } from '@veramo/core'
import { AgentRestClient } from '@veramo/remote-client'
import { Server } from 'http'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'
import { getConfig } from '@veramo/cli/build/setup'
import { createObjects } from '@veramo/cli/build/lib/objectCreator'
import { DidAuthSiopOpAuthenticator, IDidAuthSiopOpAuthenticator } from '../src'
import { Resolver } from 'did-resolver'
import { getDidKeyResolver } from '@veramo/did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { getUniResolver } from '@sphereon/did-uni-client'
import didAuthSiopOpAuthenticatorAgentLogic from './shared/didAuthSiopOpAuthenticatorAgentLogic'
import { PresentationSignCallback } from '@sphereon/did-auth-siop'

jest.setTimeout(30000)

const port = 3002
const basePath = '/agent'
let serverAgent: IAgent
let restServer: Server

const presentationSignCallback: PresentationSignCallback = async (args) => ({
  ...args.presentation,
  proof: {
    type: 'RsaSignature2018',
    created: '2018-09-14T21:19:10Z',
    proofPurpose: 'authentication',
    verificationMethod: 'did:example:ebfeb1f712ebc6f1c276e12ec21#keys-1',
    challenge: '1f44d55f-f161-4938-a659-f8026467f126',
    domain: '4jt78h47fh47',
    jws: 'eyJhbGciOiJSUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..kTCYt5XsITJX1CxPCT8yAV-TVIw5WEuts01mq-pQy7UJiN5mgREEMGlv50aqzpqh4Qq_PbChOMqsLfRoPsnsgxD-WUcX16dUOqV0G_zS245-kronKb78cPktb3rk-BuQy72IFLN25DYuNzVBAh4vGHSrQyHUGlcTwLtjPAnKb78'
  }
})

const getAgent = (options?: IAgentOptions) =>
  createAgent<IDidAuthSiopOpAuthenticator & IDataStore>({
    ...options,
    plugins: [
      new DidAuthSiopOpAuthenticator(presentationSignCallback),
      new DIDResolverPlugin({
        resolver: new Resolver({
          ...getDidKeyResolver(),
          ...getUniResolver('lto', { resolveUrl: 'https://uniresolver.test.sphereon.io/1.0/identifiers' }),
          ...getUniResolver('factom', { resolveUrl: 'https://uniresolver.test.sphereon.io/1.0/identifiers' }),
        }),
      }),
      new AgentRestClient({
        url: 'http://localhost:' + port + basePath,
        enabledMethods: serverAgent.availableMethods(),
        schema: serverAgent.getSchema(),
      }),
    ],
  })

const setup = async (): Promise<boolean> => {
  const config = getConfig('packages/did-auth-siop-op-authenticator/agent.yml')
  config.agent.$args[0].plugins[1].$args[0] = presentationSignCallback
  const { agent } = createObjects(config, { agent: '/agent' })
  agent.registerCustomApprovalForSiop({ key: 'success', customApproval: () => Promise.resolve() })
  agent.registerCustomApprovalForSiop({ key: 'failure', customApproval: () => Promise.reject(new Error('denied')) })
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

const testContext = {
  getAgent,
  setup,
  tearDown,
  isRestTest: true,
}

describe('REST integration tests', () => {
  didAuthSiopOpAuthenticatorAgentLogic(testContext)
})
