import { beforeAll, describe, expect, it } from 'vitest'
import { CredentialPayload, IDIDManager, IIdentifier, IKeyManager, IResolver, TAgent } from '@veramo/core'
import { createAgent } from '@sphereon/ssi-sdk.agent-config'
import { ContextDoc, IVcdmCredentialPlugin, VcdmCredentialPlugin } from '..'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { MemoryKeyStore, MemoryPrivateKeyStore, SphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { SphereonKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-local'
import { getDidKeyResolver, SphereonKeyDidProvider } from '@sphereon/ssi-sdk-ext.did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { EthrDIDProvider } from '@veramo/did-provider-ethr'
import {
  CredentialProviderJsonld,
  LdDefaultContexts,
  SphereonEcdsaSecp256k1RecoverySignature2020, SphereonEd25519Signature2018,
  SphereonEd25519Signature2020
} from '../../../credential-vcdm-jsonld-provider/src'
import { Resolver } from 'did-resolver'
import { getResolver as ethrDidResolver } from 'ethr-did-resolver'

import { CredentialProviderJWT } from '../../../credential-vcdm1-jwt-provider/src'
import { VerifiableCredentialSP } from '@sphereon/ssi-sdk.core'

const customContext: Record<string, ContextDoc> = {
  'custom:example.context': {
    '@context': {
      nothing: 'custom:example.context#blank',
    },
  },
}

const infuraProjectId = '3586660d179141e3801c3895de1c2eba'

describe('credential-w3c full flow', () => {
  let didKeySecp256r1Identifier: IIdentifier
  let didKeyEd25519Identifier: IIdentifier
  let didKeySecp256r1KeyRef: string
  let didKeyEd25519KeyRef: string
  let agent: TAgent<IResolver & IKeyManager & IDIDManager & IVcdmCredentialPlugin>
  let jwtCredential, ldsCredential: CredentialPayload

  beforeAll(async () => {
    const jwt = new CredentialProviderJWT()
    const ld = new CredentialProviderJsonld({
      contextMaps: [LdDefaultContexts, customContext],
      suites: [new SphereonEd25519Signature2018(), new SphereonEd25519Signature2020(), new SphereonEcdsaSecp256k1RecoverySignature2020()],
    })
    agent = await createAgent<IResolver & IKeyManager & IDIDManager & IVcdmCredentialPlugin>({
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
              network: 'sepolia',
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
        new VcdmCredentialPlugin({ issuers: [jwt, ld] }),
      ],
    })
    didKeySecp256r1Identifier = await agent.didManagerCreate({ options: { type: 'Secp256r1' } })
    didKeyEd25519Identifier = await agent.didManagerCreate({ options: { type: 'Ed25519' } })
    didKeySecp256r1KeyRef = didKeySecp256r1Identifier.keys[0].kid
    didKeyEd25519KeyRef = didKeyEd25519Identifier.keys[0].kid
    jwtCredential = {
      issuer: didKeySecp256r1Identifier.did,
      '@context': ['https://www.w3.org/2018/credentials/v1', 'custom:example.context'],
      credentialSubject: {
        nothing: 'else matters',
      },
    }
    ldsCredential = {
      ...jwtCredential,
      issuer: didKeyEd25519Identifier.did,
    }
  })

  it(`verifies a credential created with jwt proofType`, async () => {
    const verifiableCredential1 = await agent.createVerifiableCredential({
      credential: jwtCredential,
      proofFormat: 'jwt',
      keyRef: didKeySecp256r1KeyRef,
    })
    const verifyResult = await agent.verifyCredential({ credential: verifiableCredential1 })
    expect(verifyResult.verified).toBeTruthy()
  })

  it(`verifies a credential created with lds proofType`, async () => {
    const verifiableCredential1 = await agent.createVerifiableCredential({
      credential: ldsCredential,
      proofFormat: 'lds',
      keyRef: didKeyEd25519KeyRef,
    })
    const verifyResult = await agent.verifyCredential({ credential: verifiableCredential1 })
    expect(verifyResult.verified).toBeTruthy()
  })

  it(`fails to verify a credential created with lds proofType with modified values`, async () => {
    const verifiableCredential1 = await agent.createVerifiableCredential({
      credential: ldsCredential,
      proofFormat: 'lds',
      keyRef: didKeyEd25519KeyRef,
    })
    const modifiedCredential: VerifiableCredentialSP = { ...verifiableCredential1, issuer: { id: 'did:fake:wrong' } }
    const verifyResult = await agent.verifyCredential({ credential: modifiedCredential })
    expect(verifyResult.verified).toBeFalsy()
  })

  it('fails the verification of a jwt credential with false value outside of proof', async () => {
    const verifiableCredential1 = await agent.createVerifiableCredential({
      credential: jwtCredential,
      keyRef: didKeySecp256r1KeyRef,
      proofFormat: 'jwt',
    })

    const modifiedCredential: VerifiableCredentialSP = { ...verifiableCredential1, issuer: { id: 'did:fake:wrong' } }
    const verifyResult = await agent.verifyCredential({ credential: modifiedCredential })

    expect(verifyResult.verified).toBeFalsy()
  })

  // example credential found at: https://learn.mattr.global/tutorials/web-credentials/issue/issue-basic
  it.skip(`verifies a credential created with lds proofType via Mattr`, async () => {
    const verifiableCredential1 = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        {
          '@vocab': 'https://w3id.org/security/undefinedTerm#',
        },
        'https://schema.org',
      ],
      type: ['VerifiableCredential', 'CourseCredential'],
      issuer: {
        id: 'did:key:z6MkndAHigYrXNpape7jgaC7jHiWwxzB3chuKUGXJg2b5RSj',
        name: 'tenant',
      },
      issuanceDate: '2021-07-26T01:05:05.152Z',
      credentialSubject: {
        id: 'did:key:z6MkfxQU7dy8eKxyHpG267FV23agZQu9zmokd8BprepfHALi',
        givenName: 'Chris',
        familyName: 'Shin',
        educationalCredentialAwarded: 'Certificate Name',
      },
      proof: {
        type: 'Ed25519Signature2018',
        created: '2021-07-26T01:05:06Z',
        jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..o6hnrrWpArG8LQz2Ex_u66_BtuPdp3Hkz18nhNdNhJ7J1k_2lmCCwsNdmo-kNFirZdSIMzqO-V3wEjMDphVEAA',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:key:z6MkndAHigYrXNpape7jgaC7jHiWwxzB3chuKUGXJg2b5RSj#z6MkndAHigYrXNpape7jgaC7jHiWwxzB3chuKUGXJg2b5RSj',
      },
    } satisfies VerifiableCredentialSP
    const verifyResult = await agent.verifyCredential({ credential: verifiableCredential1, fetchRemoteContexts: false })
    expect(verifyResult.verified).toBeTruthy()
  })

  it('verify a verifiablePresentation', async () => {
    const verifiableCredential1 = await agent.createVerifiableCredential({
      credential: jwtCredential,
      keyRef: didKeySecp256r1KeyRef,
      proofFormat: 'jwt',
    })

    const verifiablePresentation = await agent.createVerifiablePresentation({
      presentation: {
        // @ts-ignore
        verifiableCredential: [verifiableCredential1],
        holder: didKeySecp256r1Identifier.did,
      },
      challenge: 'VERAMO',
      proofFormat: 'jwt',
    })

    expect(verifiablePresentation).toBeDefined()

    const response = await agent.verifyPresentation({
      presentation: verifiablePresentation,
      challenge: 'VERAMO',
    })

    expect(response.verified).toBe(true)
  })

  it.skip('fails the verification of an expired credential', async () => {
    const presentationJWT =
      'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NjAyOTcyMTAsInZwIjp7IkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sInR5cGUiOlsiVmVyaWZpYWJsZVByZXNlbnRhdGlvbiJdLCJ2ZXJpZmlhYmxlQ3JlZGVudGlhbCI6WyJleUpoYkdjaU9pSkZaRVJUUVNJc0luUjVjQ0k2SWtwWFZDSjkuZXlKbGVIQWlPakUyTmpBeU9UY3lNVEFzSW5aaklqcDdJa0JqYjI1MFpYaDBJanBiSW1oMGRIQnpPaTh2ZDNkM0xuY3pMbTl5Wnk4eU1ERTRMMk55WldSbGJuUnBZV3h6TDNZeElpd2lZM1Z6ZEc5dE9tVjRZVzF3YkdVdVkyOXVkR1Y0ZENKZExDSjBlWEJsSWpwYklsWmxjbWxtYVdGaWJHVkRjbVZrWlc1MGFXRnNJbDBzSW1OeVpXUmxiblJwWVd4VGRXSnFaV04wSWpwN0ltNXZkR2hwYm1jaU9pSmxiSE5sSUcxaGRIUmxjbk1pZlgwc0ltNWlaaUk2TVRZMk1ESTVOekl4TUN3aWFYTnpJam9pWkdsa09tdGxlVHA2TmsxcmFWVTNVbk5hVnpOeWFXVmxRMjg1U25OMVVEUnpRWEZYZFdGRE0zbGhjbWwxWVZCMlVXcHRZVzVsWTFBaWZRLkZhdzBEUWNNdXpacEVkcy1LR3dOalMyM2IzbUEzZFhQWXBQcGJzNmRVSnhIOVBrZzVieGF3UDVwMlNPajdQM25IdEpCR3lwTjJ3NzRfZjc3SjF5dUJ3Il19LCJuYmYiOjE2NjAyOTcyMTAsImlzcyI6ImRpZDprZXk6ejZNa2lVN1JzWlczcmllZUNvOUpzdVA0c0FxV3VhQzN5YXJpdWFQdlFqbWFuZWNQIn0.YcYbyqVlD8YsTjVw0kCEs0P_ie6SFMakf_ncPntEjsmS9C4cKyiS50ZhNkOv0R3Roy1NrzX7h93WBU55KeJlCw'

    const response = await agent.verifyPresentation({
      presentation: presentationJWT,
    })

    expect(response.verified).toBe(false)
    expect(response.error).toBeDefined()
    expect(response.error?.message).toContain('JWT has expired')
  })

  it.skip('fails the verification with nbf in the future', async () => {
    const presentationJWT =
      'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2cCI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJ0eXBlIjpbIlZlcmlmaWFibGVQcmVzZW50YXRpb24iXSwidmVyaWZpYWJsZUNyZWRlbnRpYWwiOlsiZXlKaGJHY2lPaUpGWkVSVFFTSXNJblI1Y0NJNklrcFhWQ0o5LmV5SjJZeUk2ZXlKQVkyOXVkR1Y0ZENJNld5Sm9kSFJ3Y3pvdkwzZDNkeTUzTXk1dmNtY3ZNakF4T0M5amNtVmtaVzUwYVdGc2N5OTJNU0lzSW1OMWMzUnZiVHBsZUdGdGNHeGxMbU52Ym5SbGVIUWlYU3dpZEhsd1pTSTZXeUpXWlhKcFptbGhZbXhsUTNKbFpHVnVkR2xoYkNKZExDSmpjbVZrWlc1MGFXRnNVM1ZpYW1WamRDSTZleUp1YjNSb2FXNW5Jam9pWld4elpTQnRZWFIwWlhKekluMTlMQ0p1WW1ZaU9qRXhOall3TWprNE5UZzRMQ0pwYzNNaU9pSmthV1E2YTJWNU9ubzJUV3QyYlhCeFRXbDFOM2h1U25kVE9YQkVSR0ZSYW1oQ1dUWndlbU00V1RKQ2FWRnhSWFUwZW1GRldFMVdUQ0o5LnA4Y2FTS1pTcGdISm1TRzhMekpnSWlWMzFRU3NjOEJ2anZuQ1JrOEM3X1UxLXV5cS11MHlQcDdjRWlSOUtXTnprN2RDQlBiR2pBRGRiNC0tV3V5LUNRIl19LCJuYmYiOjI2NjAyOTg1ODgsImlzcyI6ImRpZDprZXk6ejZNa3ZtcHFNaXU3eG5Kd1M5cEREYVFqaEJZNnB6YzhZMkJpUXFFdTR6YUVYTVZMIiwibm9uY2UiOiJWRVJBTU8ifQ.F-uiI2iVMcdm1VFzkXgtZqq8QGw5XnyEI36vGblBluHnklnNYNmE5eluQ23dbcduGWSe3ZJJ65C7HrPTUoXvDA'

    const response = await agent.verifyPresentation({
      presentation: presentationJWT,
    })

    expect(response.verified).toBe(false)
    expect(response.error).toBeDefined()
    expect(response.error?.message).toContain('JWT not valid before nbf')
  })

  /**
   * These tests can be uncommented out when the did-jwt starts to support the policies merge request
   */

  // it('passes the verification of an expired credential with policy exp false',async () => {
  //   const presentationJWT = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2cCI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJ0eXBlIjpbIlZlcmlmaWFibGVQcmVzZW50YXRpb24iXSwidmVyaWZpYWJsZUNyZWRlbnRpYWwiOlsiZXlKaGJHY2lPaUpGWkVSVFFTSXNJblI1Y0NJNklrcFhWQ0o5LmV5SjJZeUk2ZXlKQVkyOXVkR1Y0ZENJNld5Sm9kSFJ3Y3pvdkwzZDNkeTUzTXk1dmNtY3ZNakF4T0M5amNtVmtaVzUwYVdGc2N5OTJNU0lzSW1OMWMzUnZiVHBsZUdGdGNHeGxMbU52Ym5SbGVIUWlYU3dpZEhsd1pTSTZXeUpXWlhKcFptbGhZbXhsUTNKbFpHVnVkR2xoYkNKZExDSmpjbVZrWlc1MGFXRnNVM1ZpYW1WamRDSTZleUp1YjNSb2FXNW5Jam9pWld4elpTQnRZWFIwWlhKekluMTlMQ0p1WW1ZaU9qRXhOall3TWprNE5UZzRMQ0pwYzNNaU9pSmthV1E2YTJWNU9ubzJUV3QyYlhCeFRXbDFOM2h1U25kVE9YQkVSR0ZSYW1oQ1dUWndlbU00V1RKQ2FWRnhSWFUwZW1GRldFMVdUQ0o5LnA4Y2FTS1pTcGdISm1TRzhMekpnSWlWMzFRU3NjOEJ2anZuQ1JrOEM3X1UxLXV5cS11MHlQcDdjRWlSOUtXTnprN2RDQlBiR2pBRGRiNC0tV3V5LUNRIl19LCJuYmYiOjI2NjAyOTg1ODgsImlzcyI6ImRpZDprZXk6ejZNa3ZtcHFNaXU3eG5Kd1M5cEREYVFqaEJZNnB6YzhZMkJpUXFFdTR6YUVYTVZMIiwibm9uY2UiOiJWRVJBTU8ifQ.F-uiI2iVMcdm1VFzkXgtZqq8QGw5XnyEI36vGblBluHnklnNYNmE5eluQ23dbcduGWSe3ZJJ65C7HrPTUoXvDA'
  //
  //   const response = await agent.verifyPresentation({
  //     presentation: presentationJWT,
  //     policies: {
  //       exp: false
  //     }
  //   })
  //
  //   expect(response.verified).toBe(true)
  // })
  //
  // it('passes the verification with nbf in the future with policy nbf false',async () => {
  //   const presentationJWT = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2cCI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJ0eXBlIjpbIlZlcmlmaWFibGVQcmVzZW50YXRpb24iXSwidmVyaWZpYWJsZUNyZWRlbnRpYWwiOlsiZXlKaGJHY2lPaUpGWkVSVFFTSXNJblI1Y0NJNklrcFhWQ0o5LmV5SjJZeUk2ZXlKQVkyOXVkR1Y0ZENJNld5Sm9kSFJ3Y3pvdkwzZDNkeTUzTXk1dmNtY3ZNakF4T0M5amNtVmtaVzUwYVdGc2N5OTJNU0lzSW1OMWMzUnZiVHBsZUdGdGNHeGxMbU52Ym5SbGVIUWlYU3dpZEhsd1pTSTZXeUpXWlhKcFptbGhZbXhsUTNKbFpHVnVkR2xoYkNKZExDSmpjbVZrWlc1MGFXRnNVM1ZpYW1WamRDSTZleUp1YjNSb2FXNW5Jam9pWld4elpTQnRZWFIwWlhKekluMTlMQ0p1WW1ZaU9qRXhOall3TWprNE5UZzRMQ0pwYzNNaU9pSmthV1E2YTJWNU9ubzJUV3QyYlhCeFRXbDFOM2h1U25kVE9YQkVSR0ZSYW1oQ1dUWndlbU00V1RKQ2FWRnhSWFUwZW1GRldFMVdUQ0o5LnA4Y2FTS1pTcGdISm1TRzhMekpnSWlWMzFRU3NjOEJ2anZuQ1JrOEM3X1UxLXV5cS11MHlQcDdjRWlSOUtXTnprN2RDQlBiR2pBRGRiNC0tV3V5LUNRIl19LCJuYmYiOjI2NjAyOTg1ODgsImlzcyI6ImRpZDprZXk6ejZNa3ZtcHFNaXU3eG5Kd1M5cEREYVFqaEJZNnB6YzhZMkJpUXFFdTR6YUVYTVZMIiwibm9uY2UiOiJWRVJBTU8ifQ.F-uiI2iVMcdm1VFzkXgtZqq8QGw5XnyEI36vGblBluHnklnNYNmE5eluQ23dbcduGWSe3ZJJ65C7HrPTUoXvDA'
  //
  //   const response = await agent.verifyPresentation({
  //     presentation: presentationJWT,
  //     policies: {
  //       nbf: false
  //     }
  //   })
  //
  //   expect(response.verified).toBe(true)
  // })
})
