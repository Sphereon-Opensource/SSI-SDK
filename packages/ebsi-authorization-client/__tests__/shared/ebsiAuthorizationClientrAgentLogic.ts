import { IDIDManager, IIdentifier, IKeyManager, MinimalImportableKey, TAgent } from '@veramo/core'
import { IDidAuthSiopOpAuthenticator } from '@sphereon/ssi-sdk.siopv2-oid4vp-op-auth'
import { EBSIScope, IEBSIAuthorizationClient, ScopeByDefinition } from '../../src'

type ConfiguredAgent = TAgent<IKeyManager & IDIDManager & IDidAuthSiopOpAuthenticator & IEBSIAuthorizationClient>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }): void => {
  // let secp256k1ManagedKey: ManagedKeyInfo
  // let secp256r1ManagedKey: ManagedKeyInfo

  const secp256k1: MinimalImportableKey = {
    privateKeyHex: '6e491660cf923f7d9ce4a03401444b361817df9e76b926b55e21ffe7144d2ee6',
    kms: 'local',
    type: 'Secp256k1',
    meta: {
      purposes: ['capabilityInvocation'],
    },
  }

  const secp256r1: MinimalImportableKey = {
    privateKeyHex: 'f0710a0bb80c28a14ae62831bfe7f90a6937d006295fad6115e5539e7e314ee4',
    kms: 'local',
    type: 'Secp256r1',
    meta: {
      purposes: ['assertionMethod', 'authentication'],
    },
  }

  const identifier: IIdentifier = {
    did: 'did:ebsi:zeybAiJxzUUrWQ1YM51SY35',
    controllerKeyId: '03715d9dbe8db1e9244c35a72b76436fbc83f9dedd2839dd4d28ef13e91c2d8ec2',
    keys: [
      {
        type: 'Secp256k1',
        kid: '03715d9dbe8db1e9244c35a72b76436fbc83f9dedd2839dd4d28ef13e91c2d8ec2',
        publicKeyHex: '03715d9dbe8db1e9244c35a72b76436fbc83f9dedd2839dd4d28ef13e91c2d8ec2',
        meta: {
          purposes: ['capabilityInvocation'],
          algorithms: ['ES256'],
        },
        kms: 'local',
      },
      {
        type: 'Secp256r1',
        kid: '03183dca844b7398c8144e2b3999c7306cb796302aed147d668fb6fb9ba496d50d',
        publicKeyHex: '03183dca844b7398c8144e2b3999c7306cb796302aed147d668fb6fb9ba496d50d',
        meta: {
          purposes: ['assertionMethod', 'authentication'],
          algorithms: ['ES256K', 'ES256K-R', 'eth_signTransaction', 'eth_signTypedData', 'eth_signMessage', 'eth_rawSign'],
        },
        kms: 'local',
      },
    ],
    services: [],
    provider: 'did:ebsi',
  }
  let id: IIdentifier
  describe('EBSI Authorization Client Agent Plugin', (): void => {
    let agent: ConfiguredAgent

    beforeAll(async (): Promise<void> => {
      await testContext.setup()
      agent = testContext.getAgent()
      // secp256k1ManagedKey = await agent.keyManagerImport(secp256k1)
      // secp256r1ManagedKey = await agent.keyManagerImport(secp256r1)
      id = await agent.didManagerImport({
        did: identifier.did,
        provider: 'did:ebsi',
        keys: [secp256k1, secp256r1],
      })
    })

    it('Should retrieve the discovery metadata', async () => {
      await expect(agent.ebsiAuthASDiscoveryMetadataGet()).resolves.toEqual({
        authorization_endpoint: 'https://api-pilot.ebsi.eu/authorisation/v4/authorize',
        grant_types_supported: ['vp_token'],
        id_token_signing_alg_values_supported: ['none'],
        id_token_types_supported: ['subject_signed_id_token'],
        issuer: 'https://api-pilot.ebsi.eu/authorisation/v4',
        jwks_uri: 'https://api-pilot.ebsi.eu/authorisation/v4/jwks',
        presentation_definition_endpoint: 'https://api-pilot.ebsi.eu/authorisation/v4/presentation-definitions',
        response_types_supported: ['token'],
        scopes_supported: [
          'openid',
          'didr_invite',
          'didr_write',
          'tir_invite',
          'tir_write',
          'timestamp_write',
          'tnt_authorise',
          'tnt_create',
          'tnt_write',
        ],
        subject_syntax_types_supported: ['did:ebsi', 'did:key'],
        subject_trust_frameworks_supported: ['ebsi'],
        subject_types_supported: ['public'],
        token_endpoint: 'https://api-pilot.ebsi.eu/authorisation/v4/token',
        token_endpoint_auth_methods_supported: ['private_key_jwt'],
        vp_formats_supported: {
          jwt_vc: {
            alg_values_supported: ['ES256'],
          },
          jwt_vc_json: {
            alg_values_supported: ['ES256'],
          },
          jwt_vp: {
            alg_values_supported: ['ES256'],
          },
          jwt_vp_json: {
            alg_values_supported: ['ES256'],
          },
        },
      })
    })

    it('should retrieve AS JWKS', async () => {
      await expect(agent.ebsiAuthASJwksGet()).resolves.toEqual({
        keys: [
          {
            alg: 'ES256',
            crv: 'P-256',
            kid: 'WjAPzsDrbkVAM1bHiuXyt9OFgPeTRDjKV3gph5EDVPc',
            kty: 'EC',
            x: 'e_wZpAhOH5npW8wlDYWvmVOnDIyFmvpMRdZ4ahemhqE',
            y: '-yNAHSVpGUtCWJiXwUfrTnYO2JOLFhxRYk69i1VJYhw',
          },
        ],
      })
    })

    it('should retrieve the presentation definition to onboard', async () => {
      await expect(agent.ebsiAuthPresentationDefinitionGet({ scope: EBSIScope.didr_invite })).resolves.toEqual({
        format: {
          jwt_vp: {
            alg: ['ES256', 'ES256K'],
          },
          jwt_vp_json: {
            alg: ['ES256', 'ES256K'],
          },
        },
        id: 'didr_invite_presentation',
        input_descriptors: [
          {
            constraints: {
              fields: [
                {
                  filter: {
                    contains: {
                      const: 'VerifiableAuthorisationToOnboard',
                    },
                    type: 'array',
                  },
                  path: ['$.vc.type'],
                },
              ],
            },
            format: {
              jwt_vc: {
                alg: ['ES256'],
              },
              jwt_vc_json: {
                alg: ['ES256'],
              },
            },
            id: 'didr_invite_credential',
            name: 'Accreditation to write to the DID Registry',
            purpose: 'Please present a valid VerifiableAuthorisationToOnboard issued by Root TAO or TAO',
          },
        ],
      })
    })

    // TODO create a proper credential
    it('should retrieve the authorization token', async () => {
      await expect(
        agent.ebsiAuthAccessTokenGet({
          credential: {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential', 'VerifiableAttestation', 'VerifiableAuthorisationToOnboard'],
            issuer: identifier.did,
            credentialSubject: { id: identifier.did, accreditedFor: [] },
            termsOfUse: {
              id: identifier.did,
              type: 'IssuanceCertificate',
            },
            credentialSchema: {
              id: 'https://api-pilot.ebsi.eu/trusted-schemas-registry/v2/schemas/z3MgUFUkb722uq4x3dv5yAJmnNmzDFeK5UC8x83QoeLJM',
              type: 'FullJsonSchemaValidator2021',
            },
          },
          definitionId: ScopeByDefinition.didr_invite_presentation,
          did: identifier.did,
          kid: id.keys[1].kid,
        }),
      ).resolves.toEqual({})
      // Rejected to value: [Error: {"title":"Internal Server Error","status":500,"type":"about:blank","detail":"The server encountered an internal error and was unable to complete your request"}]
    })

    afterAll(testContext.tearDown)
  })
}
