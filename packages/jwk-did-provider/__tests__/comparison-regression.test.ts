import { createAgent, DIDResolutionResult, IIdentifier, IKeyManager } from '@veramo/core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { KeyManagementSystem } from '@veramo/kms-local'
import { getDidJwkResolver, IKeyOpts, JwkDIDProvider, Key, KeyUse } from '../src'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { Resolver } from 'did-resolver'
import base64url from 'base64url'

const method = require('@or13/did-jwk')

const DID_METHOD = 'did:jwk'

const jwkDIDProvider = new JwkDIDProvider({
  defaultKms: 'mem',
})

const agent = createAgent<IKeyManager, DIDManager>({
  plugins: [
    new KeyManager({
      store: new MemoryKeyStore(),
      kms: {
        mem: new KeyManagementSystem(new MemoryPrivateKeyStore()),
      },
    }),
    new DIDManager({
      providers: {
        [DID_METHOD]: jwkDIDProvider,
      },
      defaultProvider: DID_METHOD,
      store: new MemoryDIDStore(),
    }),
    new DIDResolverPlugin({
      resolver: new Resolver({ ...getDidJwkResolver() }),
    }),
  ],
})

describe('@sphereon/jwk-did-provider comparison ES256k', () => {
  it('external JWK should result in equal DID Document', async () => {
    const { publicKeyJwk } = await method.generateKeyPair('ES256K')

    const did = await method.toDid(publicKeyJwk)
    const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: did })

    const comparisonDidDoc = await method.toDidDocument(publicKeyJwk)
    expect(didResolutionResult.didDocument).toEqual(comparisonDidDoc)
  })

  it('test resolution', async () => {
    const jwk = {
      kid: 'urn:ietf:params:oauth:jwk-thumbprint:sha-256:VmU0yXoR5Jgaoz6SDzt-awKL22Gbfoo2Wvk-cayLxlI',
      kty: 'EC',
      crv: 'secp256k1',
      alg: 'ES256K',
      x: 'lglTr5VNye5utTm0wKFpzduHFfuZOQmZU8xzvGmP0vU',
      y: 'onYhSokMMFxsDcyqhlAx9scMuoa19TRv2gFUyKhMlRI',
      // d: "9-CUAh2TXjCmjp5WVBdwHny3liSIEmwa2zZdFonq_Yw" // Needed in case we want to test with private key
    }

    const did = `did:jwk:${base64url.encode(JSON.stringify(jwk))}`

    // Resolution
    const comparisonDidDoc = await method.toDidDocument(jwk)
    const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: did })
    expect(didResolutionResult.didDocument).toEqual(comparisonDidDoc)
  })

  it('Creation from privateKeyHex', async () => {
    const privateKeyHex = 'e8fa0da4d6e7dcdf77b70e4fb0e304bb7cbcb3aeddf33257f0e007a602a46d42'
    const options: IKeyOpts = {
      key: {
        privateKeyHex,
      },
      use: KeyUse.Signature,
    }
    const identifier: IIdentifier = await agent.didManagerCreate({ options })

    const did =
      'did:jwk:eyJ1c2UiOiJzaWciLCJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJmYjY5SEE2M244ZENKd0RmaVJONGxacUtVVU1odHYyZE5BemdjUjJNY0ZBIiwieSI6Ikd3amFWNHpuSm1EZDBOdFlSWGdJeW5aOFlyWDRqN0lzLXFselFuekppclEifQ'
    expect(identifier.did).toBe(did)

    const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: did })

    const jwk = {
      kty: 'EC',
      use: 'sig',
      crv: 'secp256k1',
      x: 'fb69HA63n8dCJwDfiRN4lZqKUUMhtv2dNAzgcR2McFA',
      y: 'GwjaV4znJmDd0NtYRXgIynZ8YrX4j7Is-qlzQnzJirQ',
    }
    const verificationMethod = {
      controller:
        'did:jwk:eyJ1c2UiOiJzaWciLCJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJmYjY5SEE2M244ZENKd0RmaVJONGxacUtVVU1odHYyZE5BemdjUjJNY0ZBIiwieSI6Ikd3amFWNHpuSm1EZDBOdFlSWGdJeW5aOFlyWDRqN0lzLXFselFuekppclEifQ',
      id: '#0',
      publicKeyJwk: jwk,
      type: 'JsonWebKey2020',
    }

    expect(didResolutionResult!.didDocument!.verificationMethod).toEqual([verificationMethod])
    // We correctly resolve the use property. The other lib does not, so let's add it to their response
    expect(didResolutionResult!.didDocument).toEqual({
      assertionMethod: ['#0'],
      authentication: ['#0'],
      capabilityDelegation: ['#0'],
      capabilityInvocation: ['#0'],
      ...(await method.resolve(did)),
    })
  })
})

describe('@sphereon/jwk-did-provider comparison ES256', () => {
  it('external JWK should result in equal DID Document', async () => {
    const { publicKeyJwk } = await method.generateKeyPair('ES256')
    const did = await method.toDid(publicKeyJwk)

    const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: did })
    const comparisonDidDoc = await method.toDidDocument(publicKeyJwk)
    expect(didResolutionResult.didDocument).toEqual(comparisonDidDoc)
  })

  it('test resolution', async () => {
    const jwk = {
      kid: 'urn:ietf:params:oauth:jwk-thumbprint:sha-256:VmU0yXoR5Jgaoz6SDzt-awKL22Gbfoo2Wvk-cayLxlI',
      kty: 'EC',
      crv: 'P-256',
      alg: 'ES256',
      x: 'lglTr5VNye5utTm0wKFpzduHFfuZOQmZU8xzvGmP0vU',
      y: 'onYhSokMMFxsDcyqhlAx9scMuoa19TRv2gFUyKhMlRI',
      // d: "9-CUAh2TXjCmjp5WVBdwHny3liSIEmwa2zZdFonq_Yw"
    }

    const did = `did:jwk:${base64url.encode(JSON.stringify(jwk))}`

    // Resolution
    const comparisonDidDoc = await method.toDidDocument(jwk)
    const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: did })
    expect(didResolutionResult.didDocument).toEqual(comparisonDidDoc)
  })

  it('Creation from privateKeyHex', async () => {
    const privateKeyHex = 'e8fa0da4d6e7dcdf77b70e4fb0e304bb7cbcb3aeddf33257f0e007a602a46d42'
    const options: IKeyOpts = {
      key: {
        privateKeyHex,
      },
      use: KeyUse.Signature,
      type: Key.Secp256r1,
    }
    const identifier: IIdentifier = await agent.didManagerCreate({ options })

    const did =
      'did:jwk:eyJ1c2UiOiJzaWciLCJrdHkiOiJFQyIsImNydiI6IlAtMjU2IiwieCI6IktQalQxY0IwYU1XclBzVGp3cmdtMEhwSVNwUHZ6aGpyVGxfakVLQVhrUSIsInkiOiJpeVlGZnRwZXl5dk9FTUtjR01pOFpvT3BjVy1ULU4yc2szUl9FaVZYQmdzIn0'
    expect(identifier.did).toBe(did)

    const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: did })
    const jwk = {
      kty: 'EC',
      use: 'sig',
      crv: 'P-256',
      x: 'KPjT1cB0aMWrPsTjwrgm0HpISpPvzhjrTl_jEKAXkQ',
      y: 'iyYFftpeyyvOEMKcGMi8ZoOpcW-T-N2sk3R_EiVXBgs',
    }
    const verificationMethod = {
      controller:
        'did:jwk:eyJ1c2UiOiJzaWciLCJrdHkiOiJFQyIsImNydiI6IlAtMjU2IiwieCI6IktQalQxY0IwYU1XclBzVGp3cmdtMEhwSVNwUHZ6aGpyVGxfakVLQVhrUSIsInkiOiJpeVlGZnRwZXl5dk9FTUtjR01pOFpvT3BjVy1ULU4yc2szUl9FaVZYQmdzIn0',
      id: '#0',
      publicKeyJwk: jwk,
      type: 'JsonWebKey2020',
    }

    expect(didResolutionResult!.didDocument!.verificationMethod).toEqual([verificationMethod])
    // We correctly resolve the use property. The other lib does not, so let's add it to their response
    expect(didResolutionResult!.didDocument).toEqual({
      assertionMethod: ['#0'],
      authentication: ['#0'],
      capabilityDelegation: ['#0'],
      capabilityInvocation: ['#0'],
      ...(await method.resolve(did)),
    })
  })
})
