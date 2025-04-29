import { beforeAll, describe, expect, test } from 'vitest'

import { CredentialPayload, ICredentialPlugin, IDIDManager, IIdentifier, IKeyManager, IResolver, PresentationPayload, TAgent } from '@veramo/core'
import { VcdmCredentialPlugin } from '../action-handler.js'
import { CredentialProviderJWT } from '../../../credential-jwt/src'

import { getDidKeyResolver, SphereonKeyDidProvider } from '@sphereon/ssi-sdk-ext.did-provider-key'
import { Resolver } from 'did-resolver'
import { getResolver as ethrDidResolver } from 'ethr-did-resolver'
import { createAgent } from '@sphereon/ssi-sdk.agent-config'
import { MemoryKeyStore, MemoryPrivateKeyStore, SphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { SphereonKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-local'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { EthrDIDProvider } from '@veramo/did-provider-ethr'
import { DIDResolverPlugin } from '@veramo/did-resolver'

const infuraProjectId = '3586660d179141e3801c3895de1c2eba'

let didKeyIdentifier: IIdentifier
let didEthrIdentifier: IIdentifier
let agent: TAgent<IResolver & IKeyManager & IDIDManager & ICredentialPlugin>

describe('@sphereon/ssi-sdk.credential-vcdm', () => {
  beforeAll(async () => {
    const jwt = new CredentialProviderJWT()
    agent = await createAgent<IResolver & IKeyManager & IDIDManager & ICredentialPlugin>({
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

  test('handles createVerifiableCredential', async () => {
    expect.assertions(1)

    const issuerId = didEthrIdentifier.did

    const credential: CredentialPayload = {
      '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2020/demo/4342323'],
      type: ['VerifiableCredential', 'PublicProfile'],
      issuer: { id: issuerId },
      issuanceDate: new Date().toISOString(),
      id: 'vc1',
      credentialSubject: {
        id: 'https://example.com/user/alice',
        name: 'Alice',
        profilePicture: 'https://example.com/a.png',
        address: {
          street: 'Some str.',
          house: 1,
        },
      },
    }

    const vc = await agent.createVerifiableCredential({
      credential,
      save: false,
      proofFormat: 'jwt',
    })
    expect(vc.id).toEqual('vc1')
  })

  test('handles createVerifiablePresentation', async () => {
    expect.assertions(1)

    const issuerId = didEthrIdentifier.did

    const credential = await agent.createVerifiableCredential({
      credential: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'PublicProfile'],
        issuer: { id: issuerId },
        issuanceDate: new Date().toISOString(),
        id: 'vc1',
        credentialSubject: {
          id: 'https://example.com/user/alice',
          name: 'Alice',
          profilePicture: 'https://example.com/a.png',
          address: {
            street: 'Some str.',
            house: 1,
          },
        },
      },
      save: false,
      proofFormat: 'jwt',
    })

    const presentation: PresentationPayload = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiablePresentation'],
      holder: didEthrIdentifier.did + '?versionTime=2023-01-01T00:00:00Z',
      issuanceDate: new Date().toISOString(),
      verifiableCredential: [credential],
    }

    const vp = await agent.createVerifiablePresentation({
      presentation,
      save: false,
      proofFormat: 'jwt',
    })

    expect(vp.holder).toEqual(issuerId)
  })
})
