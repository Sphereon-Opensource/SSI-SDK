import 'cross-fetch/polyfill'
// @ts-ignore
import express from 'express'
import { Server } from 'http'
import { Connection } from 'typeorm'
import { IAgent, createAgent, IAgentOptions } from '@veramo/core'
import { AgentRestClient } from '@veramo/remote-client'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'
import { createObjects, getConfig } from '@sphereon/ssi-sdk.agent-config'

import { IWellKnownDidIssuer } from '../src'
import wellKnownDidIssuerAgentLogic from './shared/wellKnownDidIssuerAgentLogic'

jest.setTimeout(60000)

const port = 3002
const basePath = '/agent'

let serverAgent: IAgent
let restServer: Server
let dbConnection: Promise<Connection>

const getAgent = (options?: IAgentOptions) =>
  createAgent<IWellKnownDidIssuer>({
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
  const config = await getConfig('packages/wellknown-did-issuer/agent.yml')
  const { agent, db } = await createObjects(config, { agent: '/agent', db: '/dbConnection' })
  dbConnection = db

  const DID = 'did:key:z6MkoTHsgNNrby8JzCNQ1iRLyW5QQ6R8Xuu6AA8igGrMVPUM'
  const ORIGIN = 'https://example.com'
  const COMPACT_JWT_DOMAIN_LINKAGE_CREDENTIAL =
    'eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDprZXk6ejZNa29USHNnTk5yYnk4SnpDTlExaVJMeVc1UVE2UjhYdXU2QUE4aWdHck1WUFVNI3o2TWtvVEhzZ05OcmJ5OEp6Q05RMWlSTHlXNVFRNlI4WHV1NkFBOGlnR3JNVlBVTSJ9.eyJleHAiOjE3NjQ4NzkxMzksImlzcyI6ImRpZDprZXk6ejZNa29USHNnTk5yYnk4SnpDTlExaVJMeVc1UVE2UjhYdXU2QUE4aWdHck1WUFVNIiwibmJmIjoxNjA3MTEyNzM5LCJzdWIiOiJkaWQ6a2V5Ono2TWtvVEhzZ05OcmJ5OEp6Q05RMWlSTHlXNVFRNlI4WHV1NkFBOGlnR3JNVlBVTSIsInZjIjp7IkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIiwiaHR0cHM6Ly9pZGVudGl0eS5mb3VuZGF0aW9uLy53ZWxsLWtub3duL2RpZC1jb25maWd1cmF0aW9uL3YxIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImlkIjoiZGlkOmtleTp6Nk1rb1RIc2dOTnJieThKekNOUTFpUkx5VzVRUTZSOFh1dTZBQThpZ0dyTVZQVU0iLCJvcmlnaW4iOiJpZGVudGl0eS5mb3VuZGF0aW9uIn0sImV4cGlyYXRpb25EYXRlIjoiMjAyNS0xMi0wNFQxNDoxMjoxOS0wNjowMCIsImlzc3VhbmNlRGF0ZSI6IjIwMjAtMTItMDRUMTQ6MTI6MTktMDY6MDAiLCJpc3N1ZXIiOiJkaWQ6a2V5Ono2TWtvVEhzZ05OcmJ5OEp6Q05RMWlSTHlXNVFRNlI4WHV1NkFBOGlnR3JNVlBVTSIsInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJEb21haW5MaW5rYWdlQ3JlZGVudGlhbCJdfX0.aUFNReA4R5rcX_oYm3sPXqWtso_gjPHnWZsB6pWcGv6m3K8-4JIAvFov3ZTM8HxPOrOL17Qf4vBFdY9oK0HeCQ'
  const JSON_LD_DOMAIN_LINKAGE_CREDENTIAL = {
    '@context': ['https://www.w3.org/2018/credentials/v1', 'https://identity.foundation/.well-known/did-configuration/v1'],
    issuer: DID,
    issuanceDate: '2020-12-04T14:08:28-06:00',
    expirationDate: '2025-12-04T14:08:28-06:00',
    type: ['VerifiableCredential', 'DomainLinkageCredential'],
    credentialSubject: {
      id: DID,
      origin: ORIGIN,
    },
    proof: {
      type: 'Ed25519Signature2018',
      created: '2020-12-04T20:08:28.540Z',
      jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..D0eDhglCMEjxDV9f_SNxsuU-r3ZB9GR4vaM9TYbyV7yzs1WfdUyYO8rFZdedHbwQafYy8YOpJ1iJlkSmB4JaDQ',
      proofPurpose: 'assertionMethod',
      verificationMethod: `${DID}#z6MkoTHsgNNrby8JzCNQ1iRLyW5QQ6R8Xuu6AA8igGrMVPUM`,
    },
  }

  await agent.registerCredentialIssuance(
    {
      callbackName: 'issueJwt',
      credentialIssuance: () => Promise.resolve(COMPACT_JWT_DOMAIN_LINKAGE_CREDENTIAL),
    },
    null,
  )

  await agent.registerCredentialIssuance(
    {
      callbackName: 'issueJsonld',
      credentialIssuance: () => Promise.resolve(JSON_LD_DOMAIN_LINKAGE_CREDENTIAL),
    },
    null,
  )

  agent.didManagerGet = jest.fn().mockReturnValue(
    Promise.resolve({
      did: 'did:key:abc',
      services: [
        {
          id: 'did:key:abc',
          type: 'LinkedDomains',
          serviceEndpoint: 'https://example.com',
        },
      ],
    }),
  )

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
  await (await dbConnection).close()
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
  wellKnownDidIssuerAgentLogic(testContext)
})
