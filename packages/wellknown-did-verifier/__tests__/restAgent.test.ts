import 'cross-fetch/polyfill'
// @ts-ignore
import express from 'express'
import { Server } from 'http'
import { IAgent, createAgent, IAgentOptions } from '@veramo/core'
import { AgentRestClient } from '@veramo/remote-client'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'
import { createObjects, getConfig } from '@sphereon/ssi-sdk.agent-config'

import { IWellKnownDidVerifier } from '../src'
import { ServiceTypesEnum } from '@sphereon/wellknown-dids-client'
import wellKnownDidVerifierAgentLogic from './shared/wellKnownDidVerifierAgentLogic'

jest.setTimeout(60000)

const port = 3002
const basePath = '/agent'

let serverAgent: IAgent
let restServer: Server

const getAgent = (options?: IAgentOptions) =>
  createAgent<IWellKnownDidVerifier>({
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
  const config = await getConfig('packages/wellknown-did-verifier/agent.yml')
  const { agent } = await createObjects(config, { agent: '/agent' })

  await agent.registerSignatureVerification(
    {
      callbackName: 'verified',
      signatureVerification: () => Promise.resolve({ verified: true }),
    },
    null,
  )

  const DID = 'did:key:z6MkoTHsgNNrby8JzCNQ1iRLyW5QQ6R8Xuu6AA8igGrMVPUM'
  const ORIGIN = 'https://example.com'
  const DOCUMENT = {
    '@context': ['https://www.w3.org/ns/did/v1', 'https://identity.foundation/.well-known/did-configuration/v1'],
    id: DID,
    verificationMethod: [
      {
        id: `${DID}#_Qq0UL2Fq651Q0Fjd6TvnYE-faHiOpRlPVQcY_-tA4A`,
        type: 'JsonWebKey2020',
        controller: DID,
        publicKeyJwk: {
          kty: 'OKP',
          crv: 'Ed25519',
          x: 'VCpo2LMLhn6iWku8MKvSLg2ZAoC-nlOyPVQaO3FxVeQ',
        },
      },
    ],
    service: [
      {
        id: `${DID}#foo`,
        type: ServiceTypesEnum.LINKED_DOMAINS,
        // TODO add support to test multiple origins, needs Veramo version update
        serviceEndpoint: ORIGIN,
      },
      {
        id: `${DID}#bar`,
        type: ServiceTypesEnum.LINKED_DOMAINS,
        serviceEndpoint: ORIGIN,
      },
    ],
  }

  agent.resolveDid = jest.fn().mockReturnValue(Promise.resolve({ didDocument: DOCUMENT }))

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
  wellKnownDidVerifierAgentLogic(testContext)
})
