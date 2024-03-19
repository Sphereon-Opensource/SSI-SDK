import { createObjects, getConfig } from '@sphereon/ssi-sdk.agent-config'
import { DataSource } from 'typeorm'
import wellKnownDidIssuerAgentLogic from './shared/wellKnownDidIssuerAgentLogic'

jest.setTimeout(60000)

let agent: any
let dbConnection: Promise<DataSource>

const setup = async (): Promise<boolean> => {
  const config = await getConfig('packages/wellknown-did-issuer/agent.yml')
  const { localAgent, db } = await createObjects(config, { localAgent: '/agent', db: '/dbConnection' })
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

  await localAgent.registerCredentialIssuance(
    {
      callbackName: 'issueJwt',
      credentialIssuance: () => Promise.resolve(COMPACT_JWT_DOMAIN_LINKAGE_CREDENTIAL),
    },
    null,
  )

  await localAgent.registerCredentialIssuance(
    {
      callbackName: 'issueJsonld',
      credentialIssuance: () => Promise.resolve(JSON_LD_DOMAIN_LINKAGE_CREDENTIAL),
    },
    null,
  )

  localAgent.didManagerGet = jest.fn().mockReturnValue(
    Promise.resolve({
      did: DID,
      services: [
        {
          id: DID,
          type: 'LinkedDomains',
          serviceEndpoint: ORIGIN,
        },
      ],
    }),
  )

  agent = localAgent

  return true
}

const tearDown = async (): Promise<boolean> => {
  await (await dbConnection).close()
  return true
}

const getAgent = () => agent
const testContext = {
  getAgent,
  setup,
  tearDown,
  isRestTest: false,
}

describe('Local integration tests', () => {
  wellKnownDidIssuerAgentLogic(testContext)
})
