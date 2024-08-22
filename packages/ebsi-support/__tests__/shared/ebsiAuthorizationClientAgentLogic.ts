import { OpenID4VCIClient } from '@sphereon/oid4vci-client'
import { Alg, AuthorizationDetails, CredentialResponse, Jwt } from '@sphereon/oid4vci-common'
import { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { IJwtService } from '@sphereon/ssi-sdk-ext.jwt-service'
import { toJwk } from '@sphereon/ssi-sdk-ext.key-utils'
import { IDidAuthSiopOpAuthenticator } from '@sphereon/ssi-sdk.siopv2-oid4vp-op-auth'
import { IDIDManager, IIdentifier, IKeyManager, MinimalImportableKey, TAgent } from '@veramo/core'
import { fetch } from 'cross-fetch'
//@ts-ignore
import express, { Application, NextFunction, Request, Response } from 'express'
import { createServer, Server } from 'http'
import { importJWK, SignJWT } from 'jose'
import { IEbsiSupport } from '../../src'
import { CredentialRole } from '@sphereon/ssi-sdk.data-store'

type ConfiguredAgent = TAgent<IKeyManager & IDIDManager & IIdentifierResolution & IJwtService & IDidAuthSiopOpAuthenticator & IEbsiSupport>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }): void => {
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

  const jwk = toJwk(secp256r1.privateKeyHex, 'Secp256r1', { isPrivateKey: true })
  const kid = `${identifier.did}#keys-1`

  async function proofOfPossessionCallbackFunction(args: Jwt, kid?: string): Promise<string> {
    const importedJwk = await importJWK(jwk)
    return await new SignJWT({ ...args.payload })
      .setProtectedHeader({ ...args.header, kid: kid! })
      .setIssuer(identifier.did)
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(importedJwk)
  }

  let id: IIdentifier

  describe.skip('EBSI Authorization Client Agent Plugin', (): void => {
    let agent: ConfiguredAgent
    let credentialResponse: CredentialResponse
    let server: Server<any, any>

    beforeAll(async (): Promise<void> => {
      await testContext.setup()
      agent = testContext.getAgent()

      id = await agent.didManagerImport({
        did: identifier.did,
        provider: 'did:ebsi',
        keys: [secp256k1, secp256r1],
      })
      console.log(id)
      const importedJwk = await importJWK(jwk)

      const port = process?.env.PORT ?? '5151'
      const app: Application = express()
      app.use('/mock', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        console.log(`MOCK CALLED, with params:\r\n ${JSON.stringify(req.query, null, 2)}`)

        const parsedRequest = JSON.parse(JSON.stringify(req.query))

        if (parsedRequest.state) {
          console.log(`Processing ID Token request...`)
          const idToken = await new SignJWT({
            iss: identifier.did,
            sub: identifier.did,
            aud: parsedRequest.client_id,
            iat: Math.floor(Date.now()),
            exp: Math.floor(Date.now()) + 900,
            nonce: parsedRequest.nonce,
            state: parsedRequest.state,
          })
            .setProtectedHeader({
              typ: 'JWT',
              alg: 'ES256',
              kid,
            })
            .sign(importedJwk)

          const authResponse = await fetch(`${parsedRequest.redirect_uri}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `id_token=${idToken}&state=${parsedRequest.state}`,
          })
          console.log(`Authentication response: ${JSON.stringify(await authResponse.json())}`)
        } else if (parsedRequest.code) {
          console.log(`Token request`)
          // const clientAssertion = await new SignJWT({
          //   iss: 'https://api-conformance.ebsi.eu/conformance/v3/issuer-mock',
          //   sub: 'https://api-conformance.ebsi.eu/conformance/v3/issuer-mock',
          //   aud: 'https://api.conformance.ebsi.eu/conformance/v3/auth-mock',
          //   jti: uuid(),
          //   iat: Math.floor(Date.now()),
          //   exp: Math.floor(Date.now()) + 900
          // }).setProtectedHeader({
          //   typ: 'JWT',
          //   alg: 'ES256',
          //   kid
          // }).sign(importedJwk)
          //
          // const token = await (await fetch(`https://api-conformance.ebsi.eu/conformance/v3/auth-mock/token`, {
          //   method: 'POST',
          //   headers: {
          //     'Content-Type': 'application/x-www-form-urlencoded'
          //   },
          //   body: `grant_type=authorization_code&client_id=${REDIRECT_MOCK_URL}&code=${code}&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_assertion=${clientAssertion}`
          // })).json()
          //
          // console.log(JSON.stringify(token))
          client.endpointMetadata!.credentialIssuerMetadata!.authorization_endpoint =
            client.endpointMetadata?.credentialIssuerMetadata?.authorization_endpoint ?? 'https://api-conformance.ebsi.eu/conformance/v3/auth-mock'

          // FIXME fails with invalid code error
          const accessToken = await client.acquireAccessToken({ code: parsedRequest.code })
          console.log(accessToken)
        } else if (parsedRequest.access_token) {
          console.log(`credential request`)
          const format = 'jwt_vc'
          credentialResponse = await client.acquireCredentials({
            credentialTypes: ['VerifiableCredential', 'VerifiableAttestation', 'VerifiableAuthorisationToOnboard'],
            format,
            proofCallbacks: {
              signCallback: proofOfPossessionCallbackFunction,
            },
            kid,
            deferredCredentialAwait: true,
            deferredCredentialIntervalInMS: 5000,
          })
          expect(credentialResponse).toBeDefined()
        } else if (parsedRequest.error) {
          res.json(parsedRequest)
        }
        res.json({ message: 'Mock called!' })
      })
      server = createServer(app)
      server.listen(port)

      const REDIRECT_MOCK_URL = `http://localhost:${port}/mock`

      const authorizationDetails: AuthorizationDetails[] = [
        {
          type: 'openid_credential',
          format: 'jwt_vc',
          locations: ['https://conformance-test.ebsi.eu/conformance/v3/issuer-mock'],
          types: ['VerifiableCredential', 'VerifiableAttestation', 'VerifiableAuthorisationToOnboard'],
        },
      ]

      const client = await OpenID4VCIClient.fromCredentialIssuer({
        credentialIssuer: 'https://conformance-test.ebsi.eu/conformance/v3/issuer-mock',
        // @ts-ignore
        authorizationRequest: {
          authorizationDetails: authorizationDetails,
          redirectUri: REDIRECT_MOCK_URL,
          scope: 'openid',
          clientId: REDIRECT_MOCK_URL,
        },
        retrieveServerMetadata: true,
        kid,
        alg: Alg.ES256,
        clientId: REDIRECT_MOCK_URL,
      })
      const url = await client.createAuthorizationRequestUrl({
        authorizationRequest: {
          redirectUri: REDIRECT_MOCK_URL,
          clientId: REDIRECT_MOCK_URL,
          scope: 'openid',
        },
      })

      const urlWithRequest = await new SignJWT({
        iss: REDIRECT_MOCK_URL,
        aud: 'https://conformance-test.ebsi.eu/conformance/v3/auth-mock',
        redirect_uri: REDIRECT_MOCK_URL,
        scope: 'openid',
        response_type: 'code',
        client_id: REDIRECT_MOCK_URL,
        authorization_details: authorizationDetails,
        client_metadata: {
          jwks_uri: 'https://raw.githubusercontent.com/Sphereon-Opensource/SSI-SDK/feature/SDK-10/packages/ebsi-support/__tests__/shared/jwks.json',
          vp_formats_supported: {
            jwt_vp: { alg: ['ES256'] },
            jwt_vc: { alg: ['ES256'] },
          },
          response_types_supported: ['vp_token', 'id_token'],
          authorization_endpoint: REDIRECT_MOCK_URL,
        },
      })
        .setProtectedHeader({
          alg: 'ES256',
          kid,
        })
        .sign(importedJwk)
      console.log(`URL: ${url}&request=${urlWithRequest}`)
      /*  const result = await fetch(`${url}&request=${urlWithRequest}`)
            console.log(await result.text())*/
    })

    it.skip('Should retrieve the discovery metadata', async () => {
      await expect(agent.ebsiWellknownMetadata({ environment: 'pilot', version: 'v4' })).resolves.toEqual({
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

    it.skip('should retrieve AS JWKS', async () => {
      await expect(agent.ebsiAuthorizationServerJwks()).resolves.toEqual({
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

    it.skip('should retrieve the presentation definition to onboard', async () => {
      await expect(agent.ebsiPresentationDefinitionGet({ scope: 'didr_invite' })).resolves.toEqual({
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

    it('should retrieve the authorization token', async () => {
      await expect(
        agent.ebsiAccessTokenGet({
          clientId: 'clientId',
          jwksUri: 'https://exmplae.com',
          attestationCredential:
            'eyJ0eXAiOiJKV1QiLCJraWQiOiIxODNkY2E4NDRiNzM5OGM4MTQ0ZTJiMzk5OWM3MzA2Y2I3OTYzMDJhZWQxNDdkNjY4ZmI2ZmI5YmE0OTZkNTBkIiwiYWxnIjoiRVMyNTZLIn0.eyJpc3N1ZXIiOiJkaWQ6ZWJzaTp6aURuaW94WVlMVzFhM3FVYnFURno0VyIsImlhdCI6MTcxNDQxMzA4OCwianRpIjoidXJuOnV1aWQ6NWZiN2Q5OGItMTA4Yy00YmMwLTlmZmMtYzY5Zjg0ZWQ3ODhmIiwibmJmIjoxNzE0NDEzMDg4LCJleHAiOjE3NDU5NDkwODgsInN1YiI6ImRpZDplYnNpOnpleWJBaUp4elVVcldRMVlNNTFTWTM1IiwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiXSwiaWQiOiJ1cm46dXVpZDo1ZmI3ZDk4Yi0xMDhjLTRiYzAtOWZmYy1jNjlmODRlZDc4OGYiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiVmVyaWZpYWJsZUF0dGVzdGF0aW9uIiwiVmVyaWZpYWJsZUF1dGhvcmlzYXRpb25Ub09uYm9hcmQiXSwiaXNzdWFuY2VEYXRlIjoiMjAyNC0wNC0yOVQxNzo1MToyOFoiLCJpc3N1ZWQiOiIyMDI0LTA0LTI5VDE3OjUxOjI4WiIsInZhbGlkRnJvbSI6IjIwMjQtMDQtMjlUMTc6NTE6MjhaIiwiZXhwaXJhdGlvbkRhdGUiOiIyMDI1LTA0LTI5VDE3OjUxOjI4WiIsImlzc3VlciI6ImRpZDplYnNpOnppRG5pb3hZWUxXMWEzcVVicVRGejRXIiwiY3JlZGVudGlhbFN1YmplY3QiOnsiaWQiOiJkaWQ6ZWJzaTp6ZXliQWlKeHpVVXJXUTFZTTUxU1kzNSIsImFjY3JlZGl0ZWRGb3IiOltdfSwidGVybXNPZlVzZSI6eyJpZCI6ImRpZDplYnNpOnpleWJBaUp4elVVcldRMVlNNTFTWTM1IiwidHlwZSI6Iklzc3VhbmNlQ2VydGlmaWNhdGUifSwiY3JlZGVudGlhbFNjaGVtYSI6eyJpZCI6Imh0dHBzOi8vYXBpLXBpbG90LmVic2kuZXUvdHJ1c3RlZC1zY2hlbWFzLXJlZ2lzdHJ5L3YyL3NjaGVtYXMvejNNZ1VGVWtiNzIydXE0eDNkdjV5QUptbk5tekRGZUs1VUM4eDgzUW9lTEpNIiwidHlwZSI6IkZ1bGxKc29uU2NoZW1hVmFsaWRhdG9yMjAyMSJ9fX0.QWNWTWlrbUpLcFJaLVBGczQ0U3Mxb200Mk4yb3JzWndsTXp3REpHTTMxSUM2WG5ZVXJ0ZlY4RHFTbVQtaXBIMEdLSDZhclFEcGtrbXZTTy1NenYxWEE',
          credentialRole: CredentialRole.ISSUER,
          // definitionId: ScopeByDefinition.didr_invite_presentation,
          idOpts: { identifier },
          /*          did: identifier.did,
          kid: `${identifier.did}#${id.keys[1].kid}`,*/
          scope: 'didr_invite',
          environment: 'conformance-test',
        }),
      ).resolves.toEqual({})
    })

    afterAll(() => {
      server?.close()
      server?.unref()
      testContext.tearDown
    })
  })
}

/*
 Resolvable DID
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/jws-2020/v1"
  ],
  "id": "did:ebsi:ziDnioxYYLW1a3qUbqTFz4W",
  "verificationMethod": [
    {
      "id": "did:ebsi:ziDnioxYYLW1a3qUbqTFz4W#keys-1",
      "type": "JsonWebKey2020",
      "controller": "did:ebsi:ziDnioxYYLW1a3qUbqTFz4W",
      "publicKeyJwk": {
        "kty": "EC",
        "crv": "secp256k1",
        "x": "Yr5dSC8vVBhz_a_EiIjH63shj1uqPeg8UjtoUXtsVZU",
        "y": "NicHUkZrnM1GgWn1GO4Dl27Q5rD-kG-ODF_jhZYSyQw"
      }
    }
  ],
  "authentication": [
    "did:ebsi:ziDnioxYYLW1a3qUbqTFz4W#keys-1"
  ],
  "assertionMethod": [
    "did:ebsi:ziDnioxYYLW1a3qUbqTFz4W#keys-1"
  ]
}
 */
