import { toJwkFromKey } from '@sphereon/ssi-sdk-ext.key-utils'
import { IDIDManager, IIdentifier, IKeyManager, TAgent } from '@veramo/core'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { IIdentifierResolution } from '../../src'

type ConfiguredAgent = TAgent<IKeyManager & IDIDManager & IIdentifierResolution>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }) => {
  let agent: ConfiguredAgent
  let identifier: IIdentifier | undefined = undefined
  beforeAll(async () => {
    await testContext.setup().then(() => (agent = testContext.getAgent()))
    identifier = await agent.didManagerCreate({ kms: 'local' })
  })
  afterAll(testContext.tearDown)

  describe('internal identifier-resolution', () => {
    it('should resolve did identifier by did string', async () => {
      if (!identifier) {
        throw Error('No identifier')
      }

      // These all contain a did or are an internal did identifier
      await expect(agent.identifierManagedGet({ identifier: identifier! })).resolves.toMatchObject(didMatcher)
      await expect(agent.identifierManagedGetByDid({ identifier: identifier! })).resolves.toMatchObject(didMatcher)
      await expect(agent.identifierManagedGet({ identifier: identifier.did })).resolves.toMatchObject(didMatcher)
      await expect(agent.identifierManagedGetByDid({ identifier: identifier.did })).resolves.toMatchObject(didMatcher)
      await expect(agent.identifierManagedGet({ identifier: identifier.controllerKeyId! })).resolves.toMatchObject(didMatcher)
      await expect(agent.identifierManagedGetByDid({ identifier: identifier.controllerKeyId! })).resolves.toMatchObject(didMatcher)
    })

    it('should resolve kid identifier by kid string', async () => {
      if (!identifier) {
        throw Error('No identifier')
      }

      const jwk = toJwkFromKey(identifier.keys[0])

      // These are kid (actual kid and jwk thumbprint)
      await expect(agent.identifierManagedGet({ identifier: identifier.keys[0].kid })).resolves.toMatchObject(kidMatcher)
      await expect(agent.identifierManagedGetByKid({ identifier: identifier.keys[0].kid })).resolves.toMatchObject(kidMatcher)
      await expect(agent.identifierManagedGet({ identifier: identifier.keys[0].meta!.jwkThumbprint! })).resolves.toMatchObject(kidMatcher)
      await expect(agent.identifierManagedGetByKid({ identifier: identifier.keys[0].meta!.jwkThumbprint! })).resolves.toMatchObject(kidMatcher)
      await expect(agent.identifierManagedGet({ identifier: jwk })).resolves.toMatchObject(kidMatcher)
      await expect(agent.identifierManagedGetByJwk({ identifier: jwk })).resolves.toMatchObject(kidMatcher)
    })
  })

  describe('external identifier-resolution', () => {
    it('should resolve did identifier by did string', async () => {
      if (!identifier) {
        throw Error('No identifier')
      }

      // Although we created the JWK identifier, it is an in memory construct and can be resolved by any DID:JWK resolver
      // const jwk = toJwkFromKey(identifier.keys[0])
      const did = identifier.did

      // These all contain a did or are an internal did identifier
      const didResult = await agent.identifierExternalResolve({ identifier: did })
      console.log('==========================')
      console.log(JSON.stringify(didResult, null, 2))
      expect(didResult).toMatchObject(resolvedDidMatcher)

      const did2Result = await agent.identifierExternalResolveByDid({ identifier: did })
      console.log('==========================')
      console.log(JSON.stringify(did2Result, null, 2))
      console.log('==========================')

      expect(did2Result).toMatchObject(resolvedDidMatcher)
    })

    it('should resolve x5c identifier by x5c array', async () => {
      const verificationTime = new Date('2024-08-13T13:28:16.457Z')
      const certResult = await agent.identifierExternalResolve({
        identifier: [sphereonTest, sphereonCA],
        trustAnchors: [sphereonCA],
        verificationTime,
      })
      expect(certResult).toBeDefined()
      expect(certResult.method).toEqual('x5c')
      expect(certResult.jwks.length).toEqual(2)

      const certResult2 = await agent.identifierExternalResolveByX5c({
        identifier: [sphereonTest, sphereonCA],
        trustAnchors: [sphereonCA],
        verificationTime,
      })

      expect(certResult2).toEqual(certResult)
      expect(certResult2.verificationResult).toBeDefined()
      expect(certResult2.verificationResult?.error).toBe(false)
    })
  })
}

const kidMatcher = {
  jwk: {
    alg: 'ES256',
    crv: 'P-256',
    kty: 'EC',
  },
  key: {
    kms: 'local',
    meta: {
      algorithms: ['ES256'],
    },
    type: 'Secp256r1',
  },
  method: expect.stringMatching(/(kid)|(jwk)/),
}

const didMatcher = {
  controllerKeyId: expect.stringContaining('did:jwk:'),
  did: expect.stringContaining('did:jwk:'),
  identifier: {
    controllerKeyId: expect.stringContaining('did:jwk:'),
    did: expect.stringContaining('did:jwk:'),
    keys: [
      {
        kms: 'local',
        meta: {
          algorithms: ['ES256'],
        },
        type: 'Secp256r1',
      },
    ],
    provider: 'did:jwk',
    services: [],
  },
  jwk: {
    alg: 'ES256',
    crv: 'P-256',
    kty: 'EC',
  },
  key: {
    kms: 'local',
    meta: {
      algorithms: ['ES256'],
      verificationMethod: {
        controller: expect.stringContaining('did:jwk:'),
        id: expect.stringContaining('did:jwk:'),
        type: 'JsonWebKey2020',
      },
    },
    type: 'Secp256r1',
  },
  keys: [
    {
      kms: 'local',
      meta: {
        algorithms: ['ES256'],
      },
      type: 'Secp256r1',
    },
  ],
  method: 'did',
}

const resolvedDidMatcher = {
  did: expect.stringContaining('did:jwk:'),
  didDocument: {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      {
        '@vocab': 'https://www.iana.org/assignments/jose#',
      },
    ],
    id: expect.stringContaining('did:jwk:'),
    verificationMethod: [
      {
        controller: expect.stringContaining('did:jwk:'),
        id: expect.stringContaining('did:jwk:'),
        publicKeyJwk: {
          alg: 'ES256',
          crv: 'P-256',
          kid: expect.stringContaining('did:jwk:'),
          kty: 'EC',
          use: 'sig',
          x: expect.anything(),
          y: expect.anything(),
        },
        type: 'JsonWebKey2020',
      },
    ],
  },
  didJwks: {
    assertionMethod: [
      {
        alg: 'ES256',
        crv: 'P-256',
        kid: expect.stringContaining('did:jwk:'),
        kty: 'EC',
        use: 'sig',
      },
    ],
    authentication: [
      {
        alg: 'ES256',
        crv: 'P-256',
        kid: expect.stringContaining('did:jwk:'),
        kty: 'EC',
        use: 'sig',
      },
    ],
    capabilityDelegation: [
      {
        alg: 'ES256',
        crv: 'P-256',
        kid: expect.stringContaining('did:jwk:'),
        kty: 'EC',
        use: 'sig',
      },
    ],
    capabilityInvocation: [
      {
        alg: 'ES256',
        crv: 'P-256',
        kid: expect.stringContaining('did:jwk:'),
        kty: 'EC',
        use: 'sig',
      },
    ],
    keyAgreement: [],
    verificationMethod: [
      {
        alg: 'ES256',
        crv: 'P-256',
        kid: expect.stringContaining('did:jwk:'),
        kty: 'EC',
        use: 'sig',
      },
    ],
  },
  didParsed: {
    did: expect.stringContaining('did:jwk:'),
    didUrl: expect.stringContaining('did:jwk:'),
    id: expect.stringContaining('ey'),
    method: 'jwk',
  },
  didResolutionResult: {
    didDocumentMetadata: {},
    didResolutionMetadata: {
      contentType: 'application/did+ld+json',
      did: {
        didString: expect.stringContaining('did:jwk:'),
        method: 'jwk',
        methodSpecificId: expect.stringContaining('ey'),
      },
      pattern: '^(did:jwk:.+)$',
    },
  },
  jwks: [
    {
      jwk: {
        alg: 'ES256',
        crv: 'P-256',
        kid: expect.stringContaining('did:jwk:'),
        kty: 'EC',
        use: 'sig',
        x: expect.anything(),
        y: expect.anything(),
      },
      jwkThumbprint: expect.anything(),
      kid: expect.stringContaining('did:jwk:'),
      publicKeyHex: expect.anything(),
    },
  ],
  method: 'did',
}

const sphereonCA =
  '-----BEGIN CERTIFICATE-----\n' +
  'MIICCDCCAa6gAwIBAgITAPMgqwtYzWPBXaobHhxG9iSydTAKBggqhkjOPQQDAjBa\n' +
  'MQswCQYDVQQGEwJOTDEkMCIGA1UECgwbU3BoZXJlb24gSW50ZXJuYXRpb25hbCBC\n' +
  'LlYuMQswCQYDVQQLDAJJVDEYMBYGA1UEAwwPY2Euc3BoZXJlb24uY29tMB4XDTI0\n' +
  'MDcyODIxMjY0OVoXDTM0MDcyODIxMjY0OVowWjELMAkGA1UEBhMCTkwxJDAiBgNV\n' +
  'BAoMG1NwaGVyZW9uIEludGVybmF0aW9uYWwgQi5WLjELMAkGA1UECwwCSVQxGDAW\n' +
  'BgNVBAMMD2NhLnNwaGVyZW9uLmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IA\n' +
  'BEiA0KeESSNrOcmCDga8YsBkUTgowZGwqvL2n91JUpAMdRSwvlVFdqdiLXnk2pQq\n' +
  'T1vZnDG0I+x+iz2EbdsG0aajUzBRMB0GA1UdDgQWBBTnB8pdlVz5yKD+zuNkRR6A\n' +
  'sywywTAOBgNVHQ8BAf8EBAMCAaYwDwYDVR0lBAgwBgYEVR0lADAPBgNVHRMBAf8E\n' +
  'BTADAQH/MAoGCCqGSM49BAMCA0gAMEUCIHH7ie1OAAbff5262rzZVQa8J9zENG8A\n' +
  'QlHHFydMdgaXAiEA1Ib82mhHIYDziE0DDbHEAXOs98al+7dpo8fPGVGTeKI=\n' +
  '-----END CERTIFICATE-----'

const sphereonTest =
  '-----BEGIN CERTIFICATE-----\n' +
  'MIIC1jCCAnygAwIBAgITALtvb+InWBtzJO3mAeQZIUBXbzAKBggqhkjOPQQDAjBa\n' +
  'MQswCQYDVQQGEwJOTDEkMCIGA1UECgwbU3BoZXJlb24gSW50ZXJuYXRpb25hbCBC\n' +
  'LlYuMQswCQYDVQQLDAJJVDEYMBYGA1UEAwwPY2Euc3BoZXJlb24uY29tMB4XDTI0\n' +
  'MDgwNjIwMTYxMloXDTI0MTEwNDIyMTYxMlowJDEiMCAGA1UEAwwZdGVzdDEyMy50\n' +
  'ZXN0LnNwaGVyZW9uLmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABKclR1Ue\n' +
  'yHYFphv0y29/iv+HYN1wuhkEFgwetS52teZ7OcVNCBD0kMmqEaKjbczwd2GvbV1A\n' +
  'OxgE7AKsa3L0zxOjggFVMIIBUTAdBgNVHQ4EFgQUoWVOwL15ttB1YPUd0HgvYry0\n' +
  'Z+UwHwYDVR0jBBgwFoAU5wfKXZVc+cig/s7jZEUegLMsMsEwYQYIKwYBBQUHAQEE\n' +
  'VTBTMFEGCCsGAQUFBzAChkVodHRwOi8vZXUuY2VydC5lemNhLmlvL2NlcnRzL2Rh\n' +
  'YTFiNGI0LTg1ZmQtNGJhNC1iOTZiLTMzMmFkZDg5OWNlOS5jZXIwEwYDVR0lBAww\n' +
  'CgYIKwYBBQUHAwIwJAYDVR0RBB0wG4IZdGVzdDEyMy50ZXN0LnNwaGVyZW9uLmNv\n' +
  'bTAOBgNVHQ8BAf8EBAMCB4AwYQYDVR0fBFowWDBWoFSgUoZQaHR0cDovL2V1LmNy\n' +
  'bC5lemNhLmlvL2NybC8yY2RmN2M1ZS1iOWNkLTQzMTctYmI1Ni0zODZkMjQ0Mzgw\n' +
  'ZTIvY2FzcGhlcmVvbmNvbS5jcmwwCgYIKoZIzj0EAwIDSAAwRQIgThuggyhKePvR\n' +
  't5YEvfg6MD42N2/63L0ypw0vLZkM+zYCIQD+uInjqsfR6K/D+ebjuOAdhOyeD2nZ\n' +
  'AW29zN20WIQJsw==\n' +
  '-----END CERTIFICATE-----'
