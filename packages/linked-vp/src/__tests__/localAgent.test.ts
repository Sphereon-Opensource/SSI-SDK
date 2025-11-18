import { IdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { SphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { SphereonKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-local'
import { CredentialStore } from '@sphereon/ssi-sdk.credential-store'
import { VcdmCredentialPlugin } from '@sphereon/ssi-sdk.credential-vcdm'
import { CredentialProviderJWT } from '@sphereon/ssi-sdk.credential-vcdm1-jwt-provider'

import { DigitalCredentialEntity, DigitalCredentialStore } from '@sphereon/ssi-sdk.data-store'

import { Agent } from '@veramo/core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { WebDIDProvider } from '@veramo/did-provider-web'
import { MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { DataSource } from 'typeorm'
import { describe } from 'vitest'
import { LinkedVPManager } from '../agent/LinkedVPManager'
import linkedVPManagerAgentLogic from './shared/linkedVPManagerAgentLogic'

let agent: any

const setup = async () => {
  const db = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    synchronize: true,
    entities: [DigitalCredentialEntity],
  })
  await db.initialize()

  const digitalStore = new DigitalCredentialStore(db)
  const jwt = new CredentialProviderJWT()

  const plugins = [
    new CredentialStore({ store: digitalStore }),

    new SphereonKeyManager({
      store: new MemoryKeyStore(),
      kms: {
        local: new SphereonKeyManagementSystem(new MemoryPrivateKeyStore()),
      },
    }),

    new DIDManager({
      store: new MemoryDIDStore(),
      defaultProvider: 'did:web',
      providers: {
        [`did:web`]: new WebDIDProvider({
          defaultKms: 'local',
        }),
      },
    }),

    new IdentifierResolution(),

    new LinkedVPManager({
      holderDids: {
        default: 'did:web:example.com',
        tenant1: 'did:web:example.com:tenants:tenant1',
      },
    }),

    new VcdmCredentialPlugin({ issuers: [jwt] }),
  ]

  agent = new Agent({
    plugins,
  })

  // Create tenant DIDs
  await agent.didManagerImport({
    did: 'did:web:example.com:tenants:tenant1',
    provider: 'did:web',
    keys: [
      {
        kid: 'key-1',
        type: 'Secp256r1',
        privateKeyHex:
          '078c0f0eaa6510fab9f4f2cf8657b32811c53d7d98869fd0d5bd08a7ba34376b8adfdd44784dea407e088ff2437d5e2123e685a26dca91efceb7a9f4dfd81848',
        publicKeyHex: '8adfdd44784dea407e088ff2437d5e2123e685a26dca91efceb7a9f4dfd81848',
        kms: 'local',
      },
    ],
  })

  return true
}

const tearDown = async () => true
const getAgent = () => agent

const testContext = { getAgent, setup, tearDown, isRestTest: false }

describe('LinkedVP Manager Local integration tests', () => {
  linkedVPManagerAgentLogic(testContext)
})
