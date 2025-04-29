import { beforeAll, describe, expect, it } from 'vitest'
import { CredentialPayload, IDIDManager, IIdentifier, IResolver, TAgent } from '@veramo/core'
import { createAgent } from '@sphereon/ssi-sdk.agent-config'
import { IVcdmCredentialPlugin, VcdmCredentialPlugin } from '../../../credential-vcdm/src'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { getDidKeyResolver, SphereonKeyDidProvider } from '@sphereon/ssi-sdk-ext.did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { EthrDIDProvider } from '@veramo/did-provider-ethr'
import { Resolver } from 'did-resolver'
import { getResolver as ethrDidResolver } from 'ethr-did-resolver'

import 'cross-fetch/polyfill'
import { CredentialProviderJWT } from '../agent/CredentialProviderJWT.js'
import { ISphereonKeyManager, MemoryKeyStore, MemoryPrivateKeyStore, SphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { SphereonKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-local'

const infuraProjectId = '3586660d179141e3801c3895de1c2eba'

describe('@sphereon/ssi-sdk.credential-jwt full flow', () => {
  let didKeyIdentifier: IIdentifier
  let didEthrIdentifier: IIdentifier
  let agent: TAgent<IResolver & ISphereonKeyManager & IDIDManager & IVcdmCredentialPlugin>
  const jwt = new CredentialProviderJWT()

  beforeAll(async () => {
    agent = await createAgent<IResolver & ISphereonKeyManager & IDIDManager & IVcdmCredentialPlugin>({
      plugins: [
        new SphereonKeyManager({
          store: new MemoryKeyStore(),
          kms: {
            local: new SphereonKeyManagementSystem(new MemoryPrivateKeyStore()),
          },
        }),
        new DIDManager({
          providers: {
            'did:key': new SphereonKeyDidProvider({ defaultKms: 'local' }),
            'did:ethr': new EthrDIDProvider({
              defaultKms: 'local',
              network: 'mainnet',
            }),
          },
          store: new MemoryDIDStore(),
          defaultProvider: 'did:key',
        }),
        new DIDResolverPlugin({
          resolver: new Resolver({
            ...getDidKeyResolver(),
            ...ethrDidResolver({ infuraProjectId }),
          }),
        }),
        new VcdmCredentialPlugin({ issuers: [jwt] }),
      ],
    })
    didKeyIdentifier = await agent.didManagerCreate()
    didEthrIdentifier = await agent.didManagerCreate({ provider: 'did:ethr' })
  })

  it('issues and verifies JWT credential', async () => {
    const credential: CredentialPayload = {
      issuer: { id: didEthrIdentifier.did },
      '@context': ['https://www.w3.org/2018/credentials/v1', 'https://example.com/1/2/3'],
      type: ['VerifiableCredential', 'Custom'],
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: 'did:web:example.com',
        you: 'Rock',
      },
    }
    const verifiableCredential = await agent.createVerifiableCredential({
      credential,
      proofFormat: 'jwt',
    })

    expect(verifiableCredential).toBeDefined()

    const result = await agent.verifyCredential({
      credential: verifiableCredential,
    })

    expect(result.verified).toBe(true)
  })

  it('issues credential and verifies presentation', async () => {
    const credential: CredentialPayload = {
      issuer: { id: didEthrIdentifier.did },
      '@context': ['https://www.w3.org/2018/credentials/v1', 'https://veramo.io/contexts/profile/v1'],
      type: ['VerifiableCredential', 'Profile'],
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: didKeyIdentifier.did,
        name: 'Martin, the great',
      },
    }
    const verifiableCredential1 = await agent.createVerifiableCredential({
      credential,
      proofFormat: 'jwt',
    })

    const verifiablePresentation = await agent.createVerifiablePresentation({
      presentation: {
        verifiableCredential: [verifiableCredential1],
        holder: didEthrIdentifier.did,
      },
      challenge: 'VERAMO',
      proofFormat: 'jwt',
    })

    expect(verifiablePresentation).toBeDefined()

    const result = await agent.verifyPresentation({
      presentation: verifiablePresentation,
      challenge: 'VERAMO',
    })

    expect(result.verified).toBe(true)
  })
})
