import { createAgent, DIDResolutionResult, IIdentifier, IKeyManager } from '@veramo/core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { KeyManagementSystem } from '@veramo/kms-local'
import { getDidJwkResolver, JwkDIDProvider } from '../src'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { Resolver } from 'did-resolver'
import base64url from 'base64url'

const method = require('@or13/did-jwk')

const DID_METHOD = 'did:jwk'
// Generate a new private key in hex format if needed, using the following method:
// console.log(generatePrivateKeyHex(KeyType.Secp256k1))
// const PRIVATE_KEY_HEX = '7dd923e40f4615ac496119f7e793cc2899e99b64b88ca8603db986700089532b'

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

describe('@sphereon/jwk-did-provider comparison', () => {
  it('external JWK should result in equal DID Document', async () => {
    // const client = method.create({});
    const { privateKeyJwk, publicKeyJwk } = await method.generateKeyPair('ES256')

    console.log(JSON.stringify(privateKeyJwk, null, 2))
    console.log(JSON.stringify(publicKeyJwk, null, 2))
    const did = await method.toDid(publicKeyJwk)
    console.log(did)

    const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: did })

    const comparisonDidDoc = await method.toDidDocument(publicKeyJwk)
    console.log(JSON.stringify(comparisonDidDoc, null, 2))
    console.log(JSON.stringify(didResolutionResult, null, 2))
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

    const publicKeyHex = `04${base64url.decode(jwk.x, 'hex')}${base64url.decode(jwk.y, 'hex')}`
    console.log(publicKeyHex)
    const did = `did:jwk:${base64url.encode(JSON.stringify(jwk))}`
    console.log(did)


    // Resolution

    const comparisonDidDoc = await method.toDidDocument(jwk)

    console.log(JSON.stringify(comparisonDidDoc, null, 2))
    console.log('-----------------')
    console.log(JSON.stringify(await method.resolve(did)))

    const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: did})


    console.log(JSON.stringify(didResolutionResult.didDocument, null, 2))

  })

  it('Creation from privateKeyHex', async () => {

    const privateKeyHex = 'e8fa0da4d6e7dcdf77b70e4fb0e304bb7cbcb3aeddf33257f0e007a602a46d42'
    const options = {
      key: {
        privateKeyHex,
      },
    }
    const identifier: IIdentifier = await agent.didManagerCreate({ options })

    const did = 'did:jwk:eyJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJmYjY5SEE2M244ZENKd0RmaVJONGxacUtVVU1odHYyZE5BemdjUjJNY0ZBIiwieSI6Ikd3amFWNHpuSm1EZDBOdFlSWGdJeW5aOFlyWDRqN0lzLXFselFuekppclEifQ'
    expect(identifier.did).toBe(did)

    console.log(JSON.stringify(await method.resolve(did), null, 2))
    const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: did})
    console.log(JSON.stringify(didResolutionResult.didDocument, null, 2))

    const jwk = {
      "kty": "EC",
      "crv": "secp256k1",
      "x": "fb69HA63n8dCJwDfiRN4lZqKUUMhtv2dNAzgcR2McFA",
      "y": "GwjaV4znJmDd0NtYRXgIynZ8YrX4j7Is-qlzQnzJirQ"
    }
    const verificationMethod = {
      controller: "did:jwk:eyJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJmYjY5SEE2M244ZENKd0RmaVJONGxacUtVVU1odHYyZE5BemdjUjJNY0ZBIiwieSI6Ikd3amFWNHpuSm1EZDBOdFlSWGdJeW5aOFlyWDRqN0lzLXFselFuekppclEifQ",
      id: "#0",
      publicKeyJwk: jwk,
      type: "JsonWebKey2020"
    }
    expect(didResolutionResult!.didDocument!.verificationMethod).toEqual([verificationMethod])

    expect(method.resolve(did)).toEqual(didResolutionResult!.didDocument)

    // TODO: Investigate why we are creating all the verification method relationships, whilst orie is not creating any except for the verification method itself based on our did. This could be another cause for the problems we are seeing

  })
})
