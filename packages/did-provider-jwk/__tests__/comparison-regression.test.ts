import { dereferenceDidKeysWithJwkSupport } from '@sphereon/ssi-sdk-ext.did-utils'
import { SphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { IKeyOpts, JwkKeyUse, toJwk } from '@sphereon/ssi-sdk-ext.key-utils'
import { SphereonKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-local'
import { createAgent, DIDDocument, DIDResolutionResult, IAgentContext, IIdentifier, IKeyManager, IResolver } from '@veramo/core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import base64url from 'base64url'
import { Resolver } from 'did-resolver'
import { describe, expect, it } from 'vitest'
import { getDidJwkResolver, Key } from '../../did-resolver-jwk/src'
import { JwkDIDProvider } from '../src'

const method = require('@or13/did-jwk')

const DID_METHOD = 'did:jwk'

const jwkDIDProvider = new JwkDIDProvider({
  defaultKms: 'mem',
})

const agent = createAgent<IKeyManager & DIDManager & IResolver>({
  plugins: [
    new SphereonKeyManager({
      store: new MemoryKeyStore(),
      kms: {
        mem: new SphereonKeyManagementSystem(new MemoryPrivateKeyStore()),
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

function toAbsolute(didDoc: any, did: string) {
  return JSON.parse(JSON.stringify(didDoc).replace(/#0/g, `${did}#0`))
}

describe('@sphereon/did-provider-jwk comparison ES256k', () => {
  it('external JWK should result in equal DID Document', async () => {
    const { publicKeyJwk } = await method.generateKeyPair('ES256K')

    const did = await method.toDid(publicKeyJwk)
    const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: did })

    const comparisonDidDoc = await method.toDidDocument(publicKeyJwk)

    expect(didResolutionResult.didDocument).toEqual(toAbsolute(comparisonDidDoc, did))
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
    expect(didResolutionResult.didDocument).toEqual(toAbsolute(comparisonDidDoc, did))
  })

  it('Creation from privateKeyHex', async () => {
    const privateKeyHex = 'e8fa0da4d6e7dcdf77b70e4fb0e304bb7cbcb3aeddf33257f0e007a602a46d42'
    const options: IKeyOpts = {
      key: {
        privateKeyHex,
        type: 'Secp256k1',
      },
      use: JwkKeyUse.Signature,
    }
    const identifier: IIdentifier = await agent.didManagerCreate({ options })

    const did =
      'did:jwk:eyJhbGciOiJFUzI1NksiLCJ1c2UiOiJzaWciLCJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJmYjY5SEE2M244ZENKd0RmaVJONGxacUtVVU1odHYyZE5BemdjUjJNY0ZBIiwieSI6Ikd3amFWNHpuSm1EZDBOdFlSWGdJeW5aOFlyWDRqN0lzLXFselFuekppclEifQ'
    expect(identifier.did).toBe(did)

    const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: did })

    const jwk = {
      alg: 'ES256K',
      kty: 'EC',
      use: 'sig',
      crv: 'secp256k1',
      x: 'fb69HA63n8dCJwDfiRN4lZqKUUMhtv2dNAzgcR2McFA',
      y: 'GwjaV4znJmDd0NtYRXgIynZ8YrX4j7Is-qlzQnzJirQ',
    }
    const verificationMethod = {
      controller:
        'did:jwk:eyJhbGciOiJFUzI1NksiLCJ1c2UiOiJzaWciLCJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJmYjY5SEE2M244ZENKd0RmaVJONGxacUtVVU1odHYyZE5BemdjUjJNY0ZBIiwieSI6Ikd3amFWNHpuSm1EZDBOdFlSWGdJeW5aOFlyWDRqN0lzLXFselFuekppclEifQ',
      id: 'did:jwk:eyJhbGciOiJFUzI1NksiLCJ1c2UiOiJzaWciLCJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJmYjY5SEE2M244ZENKd0RmaVJONGxacUtVVU1odHYyZE5BemdjUjJNY0ZBIiwieSI6Ikd3amFWNHpuSm1EZDBOdFlSWGdJeW5aOFlyWDRqN0lzLXFselFuekppclEifQ#0',
      publicKeyJwk: jwk,
      type: 'JsonWebKey2020',
    }

    expect(didResolutionResult!.didDocument!.verificationMethod).toEqual([verificationMethod])
    // We correctly resolve the use property. The other lib does not, so let's add it to their response
    expect(didResolutionResult!.didDocument).toEqual({
      assertionMethod: [
        'did:jwk:eyJhbGciOiJFUzI1NksiLCJ1c2UiOiJzaWciLCJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJmYjY5SEE2M244ZENKd0RmaVJONGxacUtVVU1odHYyZE5BemdjUjJNY0ZBIiwieSI6Ikd3amFWNHpuSm1EZDBOdFlSWGdJeW5aOFlyWDRqN0lzLXFselFuekppclEifQ#0',
      ],
      authentication: [
        'did:jwk:eyJhbGciOiJFUzI1NksiLCJ1c2UiOiJzaWciLCJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJmYjY5SEE2M244ZENKd0RmaVJONGxacUtVVU1odHYyZE5BemdjUjJNY0ZBIiwieSI6Ikd3amFWNHpuSm1EZDBOdFlSWGdJeW5aOFlyWDRqN0lzLXFselFuekppclEifQ#0',
      ],
      capabilityDelegation: [
        'did:jwk:eyJhbGciOiJFUzI1NksiLCJ1c2UiOiJzaWciLCJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJmYjY5SEE2M244ZENKd0RmaVJONGxacUtVVU1odHYyZE5BemdjUjJNY0ZBIiwieSI6Ikd3amFWNHpuSm1EZDBOdFlSWGdJeW5aOFlyWDRqN0lzLXFselFuekppclEifQ#0',
      ],
      capabilityInvocation: [
        'did:jwk:eyJhbGciOiJFUzI1NksiLCJ1c2UiOiJzaWciLCJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJmYjY5SEE2M244ZENKd0RmaVJONGxacUtVVU1odHYyZE5BemdjUjJNY0ZBIiwieSI6Ikd3amFWNHpuSm1EZDBOdFlSWGdJeW5aOFlyWDRqN0lzLXFselFuekppclEifQ#0',
      ],
      ...toAbsolute(
        await method.resolve(did),
        'did:jwk:eyJhbGciOiJFUzI1NksiLCJ1c2UiOiJzaWciLCJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJmYjY5SEE2M244ZENKd0RmaVJONGxacUtVVU1odHYyZE5BemdjUjJNY0ZBIiwieSI6Ikd3amFWNHpuSm1EZDBOdFlSWGdJeW5aOFlyWDRqN0lzLXFselFuekppclEifQ'
      ),
    })
  })
})

describe('@sphereon/did-provider-jwk comparison ES256', () => {
  it('external JWK should result in equal DID Document', async () => {
    const { publicKeyJwk } = await method.generateKeyPair('ES256')
    const did = await method.toDid(publicKeyJwk)

    const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: did })
    const comparisonDidDoc = await method.toDidDocument(publicKeyJwk)
    expect(didResolutionResult.didDocument).toEqual(toAbsolute(comparisonDidDoc, did))
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
    expect(didResolutionResult.didDocument).toEqual(toAbsolute(comparisonDidDoc, did))
  })

  it('Should decode test vector from spec', async () => {
    // const did = "did:jwk:eyJjcnYiOiJQLTI1NiIsImt0eSI6IkVDIiwieCI6ImFjYklRaXVNczNpOF91c3pFakoydHBUdFJNNEVVM3l6OTFQSDZDZEgyVjAiLCJ5IjoiX0tjeUxqOXZXTXB0bm1LdG00NkdxRHo4d2Y3NEk1TEtncmwyR3pIM25TRSJ9"

    // const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: did })
    const doc = {
      '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/jws-2020/v1'],
      id: 'did:jwk:eyJjcnYiOiJQLTI1NiIsImt0eSI6IkVDIiwieCI6ImFjYklRaXVNczNpOF91c3pFakoydHBUdFJNNEVVM3l6OTFQSDZDZEgyVjAiLCJ5IjoiX0tjeUxqOXZXTXB0bm1LdG00NkdxRHo4d2Y3NEk1TEtncmwyR3pIM25TRSJ9',
      verificationMethod: [
        {
          id: 'did:jwk:eyJjcnYiOiJQLTI1NiIsImt0eSI6IkVDIiwieCI6ImFjYklRaXVNczNpOF91c3pFakoydHBUdFJNNEVVM3l6OTFQSDZDZEgyVjAiLCJ5IjoiX0tjeUxqOXZXTXB0bm1LdG00NkdxRHo4d2Y3NEk1TEtncmwyR3pIM25TRSJ9#0',
          type: 'JsonWebKey2020',
          controller:
            'did:jwk:eyJjcnYiOiJQLTI1NiIsImt0eSI6IkVDIiwieCI6ImFjYklRaXVNczNpOF91c3pFakoydHBUdFJNNEVVM3l6OTFQSDZDZEgyVjAiLCJ5IjoiX0tjeUxqOXZXTXB0bm1LdG00NkdxRHo4d2Y3NEk1TEtncmwyR3pIM25TRSJ9',
          publicKeyJwk: {
            crv: 'P-256',
            kty: 'EC',
            x: 'acbIQiuMs3i8_uszEjJ2tpTtRM4EU3yz91PH6CdH2V0',
            y: '_KcyLj9vWMptnmKtm46GqDz8wf74I5LKgrl2GzH3nSE',
          },
        },
      ],
      assertionMethod: [
        'did:jwk:eyJjcnYiOiJQLTI1NiIsImt0eSI6IkVDIiwieCI6ImFjYklRaXVNczNpOF91c3pFakoydHBUdFJNNEVVM3l6OTFQSDZDZEgyVjAiLCJ5IjoiX0tjeUxqOXZXTXB0bm1LdG00NkdxRHo4d2Y3NEk1TEtncmwyR3pIM25TRSJ9#0',
      ],
      authentication: [
        'did:jwk:$eyJjcnYiOiJQLTI1NiIsImt0eSI6IkVDIiwieCI6ImFjYklRaXVNczNpOF91c3pFakoydHBUdFJNNEVVM3l6OTFQSDZDZEgyVjAiLCJ5IjoiX0tjeUxqOXZXTXB0bm1LdG00NkdxRHo4d2Y3NEk1TEtncmwyR3pIM25TRSJ9#0',
      ],
      capabilityInvocation: [
        'did:jwk:eyJjcnYiOiJQLTI1NiIsImt0eSI6IkVDIiwieCI6ImFjYklRaXVNczNpOF91c3pFakoydHBUdFJNNEVVM3l6OTFQSDZDZEgyVjAiLCJ5IjoiX0tjeUxqOXZXTXB0bm1LdG00NkdxRHo4d2Y3NEk1TEtncmwyR3pIM25TRSJ9#0',
      ],
      capabilityDelegation: [
        'did:jwk:eyJjcnYiOiJQLTI1NiIsImt0eSI6IkVDIiwieCI6ImFjYklRaXVNczNpOF91c3pFakoydHBUdFJNNEVVM3l6OTFQSDZDZEgyVjAiLCJ5IjoiX0tjeUxqOXZXTXB0bm1LdG00NkdxRHo4d2Y3NEk1TEtncmwyR3pIM25TRSJ9#0',
      ],
      keyAgreement: [
        'did:jwk:eyJjcnYiOiJQLTI1NiIsImt0eSI6IkVDIiwieCI6ImFjYklRaXVNczNpOF91c3pFakoydHBUdFJNNEVVM3l6OTFQSDZDZEgyVjAiLCJ5IjoiX0tjeUxqOXZXTXB0bm1LdG00NkdxRHo4d2Y3NEk1TEtncmwyR3pIM25TRSJ9#0',
      ],
    }
    const context = agent.context
    const keys = await dereferenceDidKeysWithJwkSupport(doc, 'verificationMethod', {
      ...context,
      agent,
    } as IAgentContext<IResolver>)
    const publicKeyHex = keys[0].publicKeyHex as string
    expect(publicKeyHex).toEqual('0369c6c8422b8cb378bcfeeb33123276b694ed44ce04537cb3f753c7e82747d95d')
    const jwk = toJwk(publicKeyHex, 'Secp256r1', { noKidThumbprint: true })
    expect(jwk).toEqual({
      alg: 'ES256',
      kty: 'EC',
      crv: 'P-256',
      x: 'acbIQiuMs3i8_uszEjJ2tpTtRM4EU3yz91PH6CdH2V0',
      y: '_KcyLj9vWMptnmKtm46GqDz8wf74I5LKgrl2GzH3nSE',
    })
  })

  it('Should decode another test vector', async () => {
    // const did = "did:jwk:eyJjcnYiOiJQLTI1NiIsImt0eSI6IkVDIiwieCI6ImFjYklRaXVNczNpOF91c3pFakoydHBUdFJNNEVVM3l6OTFQSDZDZEgyVjAiLCJ5IjoiX0tjeUxqOXZXTXB0bm1LdG00NkdxRHo4d2Y3NEk1TEtncmwyR3pIM25TRSJ9"

    // const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: did })
    const doc = {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        {
          '@vocab': 'https://www.iana.org/assignments/jose#',
        },
      ],
      id: 'did:jwk:eyJraWQiOiJ1cm46aWV0ZjpwYXJhbXM6b2F1dGg6andrLXRodW1icHJpbnQ6c2hhLTI1NjpUOVh4eFZVUHR2TDd0Z0dMOVk4alR4WENPVDFMRjduU2VzWnl0d3FpNVM4Iiwia3R5IjoiRUMiLCJjcnYiOiJQLTI1NiIsImFsZyI6IkVTMjU2IiwieCI6InAwMUFBQ2FkNWFXYVpmVzAwbXhqU0dIVG41R3VpN3Z6cGZqQm1DX2ZhR0EiLCJ5IjoiczR4Y0FYUnVoQ1Z0YTZiaF9Vc3M3eE52NGd5UkRVQW5SS2NzRlJCMzJvWSJ9',
      verificationMethod: [
        {
          id: 'did:jwk:eyJraWQiOiJ1cm46aWV0ZjpwYXJhbXM6b2F1dGg6andrLXRodW1icHJpbnQ6c2hhLTI1NjpUOVh4eFZVUHR2TDd0Z0dMOVk4alR4WENPVDFMRjduU2VzWnl0d3FpNVM4Iiwia3R5IjoiRUMiLCJjcnYiOiJQLTI1NiIsImFsZyI6IkVTMjU2IiwieCI6InAwMUFBQ2FkNWFXYVpmVzAwbXhqU0dIVG41R3VpN3Z6cGZqQm1DX2ZhR0EiLCJ5IjoiczR4Y0FYUnVoQ1Z0YTZiaF9Vc3M3eE52NGd5UkRVQW5SS2NzRlJCMzJvWSJ9#0',
          type: 'JsonWebKey2020',
          controller:
            'did:jwk:eyJraWQiOiJ1cm46aWV0ZjpwYXJhbXM6b2F1dGg6andrLXRodW1icHJpbnQ6c2hhLTI1NjpUOVh4eFZVUHR2TDd0Z0dMOVk4alR4WENPVDFMRjduU2VzWnl0d3FpNVM4Iiwia3R5IjoiRUMiLCJjcnYiOiJQLTI1NiIsImFsZyI6IkVTMjU2IiwieCI6InAwMUFBQ2FkNWFXYVpmVzAwbXhqU0dIVG41R3VpN3Z6cGZqQm1DX2ZhR0EiLCJ5IjoiczR4Y0FYUnVoQ1Z0YTZiaF9Vc3M3eE52NGd5UkRVQW5SS2NzRlJCMzJvWSJ9',
          publicKeyJwk: {
            kid: 'urn:ietf:params:oauth:jwk-thumbprint:sha-256:T9XxxVUPtvL7tgGL9Y8jTxXCOT1LF7nSesZytwqi5S8',
            kty: 'EC',
            crv: 'P-256',
            alg: 'ES256',
            x: 'p01AACad5aWaZfW00mxjSGHTn5Gui7vzpfjBmC_faGA',
            y: 's4xcAXRuhCVta6bh_Uss7xNv4gyRDUAnRKcsFRB32oY',
          },
        },
      ],
      authentication: ['#0'],
      assertionMethod: ['#0'],
      capabilityInvocation: ['#0'],
      capabilityDelegation: ['#0'],
    } as DIDDocument

    const context = agent.context
    const keys = await dereferenceDidKeysWithJwkSupport(doc, 'verificationMethod', {
      ...context,
      agent,
    } as IAgentContext<IResolver>)
    const publicKeyHex = keys[0].publicKeyHex as string
    expect(publicKeyHex).toEqual('02a74d4000269de5a59a65f5b4d26c634861d39f91ae8bbbf3a5f8c1982fdf6860')
    const jwk = toJwk(publicKeyHex, 'Secp256r1')
    expect(jwk).toEqual({
      alg: 'ES256',
      kty: 'EC',
      kid: 'T9XxxVUPtvL7tgGL9Y8jTxXCOT1LF7nSesZytwqi5S8',
      crv: 'P-256',
      x: 'p01AACad5aWaZfW00mxjSGHTn5Gui7vzpfjBmC_faGA',
      y: 's4xcAXRuhCVta6bh_Uss7xNv4gyRDUAnRKcsFRB32oY',
    })
  })

  /*it('Creation DID Document from testvector JWK', async () => {
    const jwk = {
      kid: 'urn:ietf:params:oauth:jwk-thumbprint:sha-256:T9XxxVUPtvL7tgGL9Y8jTxXCOT1LF7nSesZytwqi5S8',
      kty: 'EC',
      crv: 'P-256',
      alg: 'ES256',
      x: 'p01AACad5aWaZfW00mxjSGHTn5Gui7vzpfjBmC_faGA',
      y: 's4xcAXRuhCVta6bh_Uss7xNv4gyRDUAnRKcsFRB32oY',
      d: 'DW08IHT19g2-I3UeTKquzq10dZucrNETLkgaXdmHsgE',
    }
    // console.log(jwk)
  })
*/
  it('Creation from privateKeyHex', async () => {
    /*const privateKeyHex = await generatePrivateKeyHex('Secp256r1')
            console.log(privateKeyHex)*/
    const privateKeyHex = '47dc6ae067aa011f8574d2da7cf8c326538af08b85e6779d192a9893291c9a0a'
    const options: IKeyOpts = {
      key: {
        privateKeyHex,
      },
      use: JwkKeyUse.Signature,
      type: Key.Secp256r1,
    }
    const identifier: IIdentifier = await agent.didManagerCreate({ options })
    /*console.log('=============================================================')
    console.log(
      'test against: did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoiOWdnczRDbTRWWGNLT2VQcGprTDlpU3lNQ2EyMnlPamJvLW9VWHB5LWF3MCIsInkiOiJsRVhXN2JfSjdsY2VpVkV0cmZwdHZ1UGVFTnNPSmwtZmh6bXU2NTRHUFI4In0'
    )
    console.log(JSON.stringify(identifier, null, 2))
    console.log('=============================================================')*/
    const did =
      'did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoiOWdnczRDbTRWWGNLT2VQcGprTDlpU3lNQ2EyMnlPamJvLW9VWHB5LWF3MCIsInkiOiJsRVhXN2JfSjdsY2VpVkV0cmZwdHZ1UGVFTnNPSmwtZmh6bXU2NTRHUFI4In0'
    expect(identifier.did).toBe(did)

    const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: did })
    const jwk = {
      alg: 'ES256',
      kty: 'EC',
      use: 'sig',
      crv: 'P-256',
      x: '9ggs4Cm4VXcKOePpjkL9iSyMCa22yOjbo-oUXpy-aw0',
      y: 'lEXW7b_J7lceiVEtrfptvuPeENsOJl-fhzmu654GPR8',
    }
    const verificationMethod = {
      controller:
        'did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoiOWdnczRDbTRWWGNLT2VQcGprTDlpU3lNQ2EyMnlPamJvLW9VWHB5LWF3MCIsInkiOiJsRVhXN2JfSjdsY2VpVkV0cmZwdHZ1UGVFTnNPSmwtZmh6bXU2NTRHUFI4In0',
      id: 'did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoiOWdnczRDbTRWWGNLT2VQcGprTDlpU3lNQ2EyMnlPamJvLW9VWHB5LWF3MCIsInkiOiJsRVhXN2JfSjdsY2VpVkV0cmZwdHZ1UGVFTnNPSmwtZmh6bXU2NTRHUFI4In0#0',
      publicKeyJwk: jwk,
      type: 'JsonWebKey2020',
    }

    expect(didResolutionResult!.didDocument!.verificationMethod).toEqual([verificationMethod])
    // We correctly resolve the use property. The other lib does not, so let's add it to their response
    expect(didResolutionResult!.didDocument).toEqual({
      assertionMethod: [
        'did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoiOWdnczRDbTRWWGNLT2VQcGprTDlpU3lNQ2EyMnlPamJvLW9VWHB5LWF3MCIsInkiOiJsRVhXN2JfSjdsY2VpVkV0cmZwdHZ1UGVFTnNPSmwtZmh6bXU2NTRHUFI4In0#0',
      ],
      authentication: [
        'did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoiOWdnczRDbTRWWGNLT2VQcGprTDlpU3lNQ2EyMnlPamJvLW9VWHB5LWF3MCIsInkiOiJsRVhXN2JfSjdsY2VpVkV0cmZwdHZ1UGVFTnNPSmwtZmh6bXU2NTRHUFI4In0#0',
      ],
      capabilityDelegation: [
        'did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoiOWdnczRDbTRWWGNLT2VQcGprTDlpU3lNQ2EyMnlPamJvLW9VWHB5LWF3MCIsInkiOiJsRVhXN2JfSjdsY2VpVkV0cmZwdHZ1UGVFTnNPSmwtZmh6bXU2NTRHUFI4In0#0',
      ],
      capabilityInvocation: [
        'did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoiOWdnczRDbTRWWGNLT2VQcGprTDlpU3lNQ2EyMnlPamJvLW9VWHB5LWF3MCIsInkiOiJsRVhXN2JfSjdsY2VpVkV0cmZwdHZ1UGVFTnNPSmwtZmh6bXU2NTRHUFI4In0#0',
      ],
      ...toAbsolute(
        await method.resolve(did),
        'did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoiOWdnczRDbTRWWGNLT2VQcGprTDlpU3lNQ2EyMnlPamJvLW9VWHB5LWF3MCIsInkiOiJsRVhXN2JfSjdsY2VpVkV0cmZwdHZ1UGVFTnNPSmwtZmh6bXU2NTRHUFI4In0'
      ),
    })
  })
})
