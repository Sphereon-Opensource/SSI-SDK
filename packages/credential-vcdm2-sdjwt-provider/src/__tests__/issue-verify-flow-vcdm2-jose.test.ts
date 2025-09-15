import { VerifiableCredentialSP } from '@sphereon/ssi-sdk.core'
import { beforeAll, describe, expect, it } from 'vitest'
import type { CredentialPayload, IDIDManager, IIdentifier, IResolver, TAgent } from '@veramo/core'
import { createAgent } from '@sphereon/ssi-sdk.agent-config'
import { type IVcdmCredentialPlugin, VcdmCredentialPlugin } from '@sphereon/ssi-sdk.credential-vcdm'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { getDidKeyResolver, SphereonKeyDidProvider } from '@sphereon/ssi-sdk-ext.did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { EthrDIDProvider } from '@veramo/did-provider-ethr'
import { Resolver } from 'did-resolver'
import { getResolver as ethrDidResolver } from 'ethr-did-resolver'

import 'cross-fetch/polyfill'
import { CredentialProviderVcdm2SdJwt } from '../agent/CredentialProviderVcdm2SdJwt'
import { type ISphereonKeyManager, MemoryKeyStore, MemoryPrivateKeyStore, SphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { SphereonKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-local'
import { IdentifierResolution, IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { IJwtService, JwtService } from '@sphereon/ssi-sdk-ext.jwt-service'
import {
  CredentialMapper,
  JwtDecodedVerifiableCredential,
  OriginalVerifiableCredential,
  VCDM_CREDENTIAL_CONTEXT_V2
} from '@sphereon/ssi-types'
import { SDJwtPlugin } from '@sphereon/ssi-sdk.sd-jwt'

const infuraProjectId = '3586660d179141e3801c3895de1c2eba'

describe('@sphereon/ssi-sdk.credential-provider-vdcm2-jose full flow', () => {
  let didKeyIdentifier: IIdentifier
  let didEthrIdentifier: IIdentifier
  let agent: TAgent<IResolver & ISphereonKeyManager & IDIDManager & IVcdmCredentialPlugin>
  const vcdm2SdJwt = new CredentialProviderVcdm2SdJwt()

  beforeAll(async () => {
    agent = await createAgent<IResolver & ISphereonKeyManager & IDIDManager & IIdentifierResolution & IJwtService & IVcdmCredentialPlugin>({
      plugins: [
        new SphereonKeyManager({
          store: new MemoryKeyStore(),
          kms: {
            local: new SphereonKeyManagementSystem(new MemoryPrivateKeyStore()),
          },
        }),
        new JwtService(),
        new IdentifierResolution(),
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
        new SDJwtPlugin(),
        new VcdmCredentialPlugin({ issuers: [vcdm2SdJwt] }),
      ],
    })
    didKeyIdentifier = await agent.didManagerCreate()
    didEthrIdentifier = await agent.didManagerCreate({ provider: 'did:ethr' })
  })

  it('issues and verifies VCDM2 SD-JWT credential', async () => {
    const credential: CredentialPayload = {
      issuer: { id: didEthrIdentifier.did },
      '@context': [VCDM_CREDENTIAL_CONTEXT_V2, 'https://example.com/1/2/3'],
      type: ['VerifiableCredential', 'Custom'],
      validFrom: new Date().toISOString(),
      credentialSubject: {
        id: 'did:web:example.com',
        you: 'Rock',
      },
    }
    const verifiableCredential = await agent.createVerifiableCredential({
      credential,
      proofFormat: 'vc+sd-jwt',
    })

    expect(verifiableCredential).toBeDefined()

    // @ts-ignore
    const jwt = CredentialMapper.toCompactJWT(verifiableCredential)

    const result = await agent.verifyCredential({
      credential: jwt,
    })

    expect(result.verified).toBe(true)
  })

  it.skip('issues credential and verifies presentation', async () => {
    const credential: CredentialPayload = {
      issuer: { id: didEthrIdentifier.did },
      '@context': [VCDM_CREDENTIAL_CONTEXT_V2, 'https://veramo.io/contexts/profile/v1'],
      type: ['VerifiableCredential', 'Profile'],
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: didKeyIdentifier.did,
        name: 'Martin, the great',
      },
    }
    const verifiableCredential1 = await agent.createVerifiableCredential({
      credential,
      proofFormat: 'vc+sd-jwt',
    })

    const verifiablePresentation = await agent.createVerifiablePresentation({
      presentation: {
        // @ts-ignore
        verifiableCredential: [verifiableCredential1],
        holder: didEthrIdentifier.did,
      },
      challenge: 'SUCCESS',
      proofFormat: 'vp+sd-jwt',
    })

    expect(verifiablePresentation).toBeDefined()

    const result = await agent.verifyPresentation({
      presentation: verifiablePresentation,
      challenge: 'SUCCESS',
    })

    expect(result.verified).toBe(true)

    const failResult = await agent.verifyPresentation({
      presentation: verifiablePresentation,
      challenge: 'FAILED',
    })

    expect(failResult.verified).toBe(false)
  })
})
