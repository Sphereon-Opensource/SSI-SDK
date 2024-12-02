import { KBJwt } from '@sd-jwt/core'
import { decodeSdJwt } from '@sd-jwt/decode'
import { SdJwtVcPayload } from '@sd-jwt/sd-jwt-vc'
import { DisclosureFrame, kbPayload } from '@sd-jwt/types'
import { JwkDIDProvider } from '@sphereon/ssi-sdk-ext.did-provider-jwk'
import { getDidJwkResolver } from '@sphereon/ssi-sdk-ext.did-resolver-jwk'
import { IdentifierResolution, IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { IJwtService, JwtService } from '@sphereon/ssi-sdk-ext.jwt-service'
import { MemoryKeyStore, MemoryPrivateKeyStore, SphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { SphereonKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-local'
import { ImDLMdoc, MDLMdoc } from '@sphereon/ssi-sdk.mdl-mdoc'
import { createAgent, IDIDManager, IKeyManager, IResolver, TAgent } from '@veramo/core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { DIDDocument, Resolver, VerificationMethod } from 'did-resolver'
import { defaultGenerateDigest } from '../defaultCallbacks'
import { ISDJwtPlugin, SDJwtPlugin } from '../index'

type AgentType = IDIDManager & IKeyManager & IIdentifierResolution & IJwtService & IResolver & ISDJwtPlugin & ImDLMdoc

describe('Agent plugin', () => {
  let agent: TAgent<AgentType>

  let issuer: string

  let holder: string

  // Issuer Define the claims object with the user's information
  const claims = {
    sub: '',
    given_name: 'John',
    family_name: 'Deo',
    email: 'johndeo@example.com',
    phone: '+1-202-555-0101',
    address: {
      street_address: '123 Main St',
      locality: 'Anytown',
      region: 'Anystate',
      country: 'US',
    },
    birthdate: '1940-01-01',
  }

  // Issuer Define the disclosure frame to specify which claims can be disclosed
  const disclosureFrame: DisclosureFrame<typeof claims> = {
    _sd: ['given_name', 'family_name', 'email', 'phone', 'address', 'birthdate'],
  }

  beforeAll(async () => {
    agent = createAgent<AgentType>({
      plugins: [
        new SDJwtPlugin(),
        new MDLMdoc(),
        new IdentifierResolution(),
        new JwtService(),
        new SphereonKeyManager({
          store: new MemoryKeyStore(),
          kms: {
            local: new SphereonKeyManagementSystem(new MemoryPrivateKeyStore()),
          },
        }),
        new DIDResolverPlugin({
          resolver: new Resolver({
            ...getDidJwkResolver(),
          }),
        }),
        new DIDManager({
          store: new MemoryDIDStore(),
          defaultProvider: 'did:jwk',
          providers: {
            'did:jwk': new JwkDIDProvider({
              defaultKms: 'local',
            }),
          },
        }),
      ],
    })
    issuer = await agent
      .didManagerCreate({
        kms: 'local',
        provider: 'did:jwk',
        alias: 'issuer',
        //we use this curve since nodejs does not support ES256k which is the default one.
        options: { keyType: 'Secp256r1' },
      })
      .then((did) => {
        // we add a key reference
        return `${did.did}#0`
      })
    holder = await agent
      .didManagerCreate({
        kms: 'local',
        provider: 'did:jwk',
        alias: 'holder',
        //we use this curve since nodejs does not support ES256k which is the default one.
        options: { keyType: 'Secp256r1' },
      })
      .then((did) => `${did.did}#0`)
    claims.sub = holder
  })

  it('create a sd-jwt', async () => {
    const credentialPayload: SdJwtVcPayload = {
      ...claims,
      iss: issuer,
      iat: Math.floor(new Date().getTime() / 1000),
      vct: '',
    }
    const credential = await agent.createSdJwtVc({
      credentialPayload,
      disclosureFrame,
    })
    expect(credential).toBeDefined()
  })

  it('create sd without an issuer', async () => {
    const credentialPayload = {
      ...claims,
      iat: Math.floor(new Date().getTime() / 1000),
      vct: '',
    }
    await expect(
      agent.createSdJwtVc({
        credentialPayload: credentialPayload as unknown as SdJwtVcPayload,
        disclosureFrame,
      }),
    ).rejects.toThrow('credential.issuer must not be empty')
  })

  it('verify a sd-jwt', async () => {
    const credentialPayload: SdJwtVcPayload = {
      ...claims,
      iss: issuer,
      iat: Math.floor(new Date().getTime() / 1000),
      vct: '',
    }
    const credential = await agent.createSdJwtVc({
      credentialPayload,
      disclosureFrame: disclosureFrame,
    })
    await agent.verifySdJwtVc({
      credential: credential.credential,
    })
  }, 5000)



  it('verify a funke sd-jwt', async () => {
    const signature = 'JAd5ZLl2_vXOwLBhyd6ceIMY9OlBasubHs5pa1gIJu2njs9VoIOMNiybFPvjuUm2IwmEcHFE_wJpvRaAwNcp6Q'
    const headerAndPayload = 'eyJ0eXAiOiJ2YytzZC1qd3QiLCJraWQiOiIwM2RmMDg3ZGVhZTc2ZjMxMDgzYTUzMDg3MDFkZDViODIzODc5YzMyYjYwNTM0YTk2Mjg2ZTE3M2EyODQ3NGU5NWYiLCJ4NWMiOlsiTUlJRFNEQ0NBdTZnQXdJQkFnSVNLOTB5Mm9vN2xPVGFDZ0lMWlBzSHBvSTFNQW9HQ0NxR1NNNDlCQU1DTUZveEN6QUpCZ05WQkFZVEFrNU1NU1F3SWdZRFZRUUtEQnRUY0dobGNtVnZiaUJKYm5SbGNtNWhkR2x2Ym1Gc0lFSXVWaTR4Q3pBSkJnTlZCQXNNQWtsVU1SZ3dGZ1lEVlFRRERBOWpZUzV6Y0dobGNtVnZiaTVqYjIwd0hoY05NalF4TVRJMk1UazBPVE15V2hjTk1qVXdNakkwTWpFME9UTXlXakNCampFTE1Ba0dBMVVFQmhNQ1Rrd3hGakFVQmdOVkJBZ01EVTV2YjNKa0xVaHZiR3hoYm1ReEVqQVFCZ05WQkFjTUNVRnRjM1JsY21SaGJURWtNQ0lHQTFVRUNnd2JVM0JvWlhKbGIyNGdTVzUwWlhKdVlYUnBiMjVoYkNCQ0xsWXVNUXN3Q1FZRFZRUUxEQUpKVkRFZ01CNEdBMVVFQXd3WFpuVnVhMlV1WkdWdGJ5NXpjR2hsY21WdmJpNWpiMjB3V1RBVEJnY3Foa2pPUFFJQkJnZ3Foa2pPUFFNQkJ3TkNBQVRmQ0gzcTUyOHhDRHBUQ0hBZDFiZ2poNXd5dGdVMHFXS0c0WE9paEhUcFh5Rlc5YnVkbVd3T0Zpb1JPSWJTeDFtTjZFbjhFNTYwUWpsWnpSa25Jek96bzRJQlhUQ0NBVmt3SFFZRFZSME9CQllFRklkUHNRMzlDZnhPSlkxVDJxbGRkZzdHd3Y2bk1COEdBMVVkSXdRWU1CYUFGT2NIeWwyVlhQbklvUDdPNDJSRkhvQ3pMRExCTUdFR0NDc0dBUVVGQndFQkJGVXdVekJSQmdnckJnRUZCUWN3QW9aRmFIUjBjRG92TDJWMUxtTmxjblF1WlhwallTNXBieTlqWlhKMGN5OWtZV0V4WWpSaU5DMDROV1prTFRSaVlUUXRZamsyWWkwek16SmhaR1E0T1RsalpUa3VZMlZ5TUIwR0ExVWRKUVFXTUJRR0NDc0dBUVVGQndNQ0JnZ3JCZ0VGQlFjREFUQWlCZ05WSFJFRUd6QVpnaGRtZFc1clpTNWtaVzF2TG5Od2FHVnlaVzl1TG1OdmJUQU9CZ05WSFE4QkFmOEVCQU1DQmFBd1lRWURWUjBmQkZvd1dEQldvRlNnVW9aUWFIUjBjRG92TDJWMUxtTnliQzVsZW1OaExtbHZMMk55YkM4eVkyUm1OMk0xWlMxaU9XTmtMVFF6TVRjdFltSTFOaTB6T0Raa01qUTBNemd3WlRJdlkyRnpjR2hsY21WdmJtTnZiUzVqY213d0NnWUlLb1pJemowRUF3SURTQUF3UlFJaEFMejBWKzg5RlZBSUVhbU5Fblh5L1RQMmJCSlI1eUU4aS8xbDRmaFNlR2RVQWlBazgvMWZ2bHFnZEQrRFM0OGJCWEswczBaZkFMZ2RBR08vak90dEErdExZZz09IiwiTUlJQ0NEQ0NBYTZnQXdJQkFnSVRBUE1ncXd0WXpXUEJYYW9iSGh4RzlpU3lkVEFLQmdncWhrak9QUVFEQWpCYU1Rc3dDUVlEVlFRR0V3Sk9UREVrTUNJR0ExVUVDZ3diVTNCb1pYSmxiMjRnU1c1MFpYSnVZWFJwYjI1aGJDQkNMbFl1TVFzd0NRWURWUVFMREFKSlZERVlNQllHQTFVRUF3d1BZMkV1YzNCb1pYSmxiMjR1WTI5dE1CNFhEVEkwTURjeU9ESXhNalkwT1ZvWERUTTBNRGN5T0RJeE1qWTBPVm93V2pFTE1Ba0dBMVVFQmhNQ1Rrd3hKREFpQmdOVkJBb01HMU53YUdWeVpXOXVJRWx1ZEdWeWJtRjBhVzl1WVd3Z1FpNVdMakVMTUFrR0ExVUVDd3dDU1ZReEdEQVdCZ05WQkFNTUQyTmhMbk53YUdWeVpXOXVMbU52YlRCWk1CTUdCeXFHU000OUFnRUdDQ3FHU000OUF3RUhBMElBQkVpQTBLZUVTU05yT2NtQ0RnYThZc0JrVVRnb3daR3dxdkwybjkxSlVwQU1kUlN3dmxWRmRxZGlMWG5rMnBRcVQxdlpuREcwSSt4K2l6MkViZHNHMGFhalV6QlJNQjBHQTFVZERnUVdCQlRuQjhwZGxWejV5S0QrenVOa1JSNkFzeXd5d1RBT0JnTlZIUThCQWY4RUJBTUNBYVl3RHdZRFZSMGxCQWd3QmdZRVZSMGxBREFQQmdOVkhSTUJBZjhFQlRBREFRSC9NQW9HQ0NxR1NNNDlCQU1DQTBnQU1FVUNJSEg3aWUxT0FBYmZmNTI2MnJ6WlZRYThKOXpFTkc4QVFsSEhGeWRNZGdhWEFpRUExSWI4Mm1oSElZRHppRTBERGJIRUFYT3M5OGFsKzdkcG84ZlBHVkdUZUtJPSJdLCJhbGciOiJFUzI1NiJ9.eyJhZ2VHcm91cCI6eyJfc2QiOlsiT01pWFpoV1FwaGdhdzdpSjVESHN5bmFNOUthTU9Vc3VQU0ZubGpySTFIOCJdfSwidmN0IjoiQWdlR3JvdXAiLCJleHAiOjE3NjQxOTYzNjgsImlzcyI6ImZ1bmtlLmRlbW8uc3BoZXJlb24uY29tIiwiaWF0IjoxNzMzMDkyMzY4LCJfc2RfYWxnIjoiU0hBLTI1NiJ9'
    const disclusure = '~WyJmNmU2OWUyYy1iM2ZkLTRiMzUtOWFlOS03NjgwMGY1YzZlZjQiLCJhZ2VPdmVyIiwxOF0~'
    const credential = `${headerAndPayload}.${signature}${disclusure}`
    console.log(credential)
    await agent.verifySdJwtVc({
      credential: credential,
    })
  }, 5000)

  it('create a presentation', async () => {
    const credentialPayload: SdJwtVcPayload = {
      ...claims,
      iss: issuer,
      iat: Math.floor(new Date().getTime() / 1000),
      vct: '',
    }
    const credential = await agent.createSdJwtVc({
      credentialPayload,
      disclosureFrame,
    })
    const presentation = await agent.createSdJwtPresentation({
      presentation: credential.credential,
      presentationFrame: { given_name: true },
      kb: {
        payload: {
          aud: '1',
          iat: 1,
          nonce: '342',
        },
      },
    })
    expect(presentation).toBeDefined()
    const decoded = await decodeSdJwt(presentation.presentation, defaultGenerateDigest)
    expect(decoded.kbJwt).toBeDefined()
    expect(((decoded.kbJwt as KBJwt).payload as kbPayload).aud).toBe('1')
  })

  it('create presentation with cnf', async () => {
    const did = await agent.didManagerFind({ alias: 'holder' }).then((dids) => dids[0])
    const resolvedDid = await agent.resolveDid({ didUrl: `${did.did}#0` })
    const jwk: JsonWebKey = ((resolvedDid.didDocument as DIDDocument).verificationMethod as VerificationMethod[])[0].publicKeyJwk as JsonWebKey
    const credentialPayload: SdJwtVcPayload = {
      ...claims,
      cnf: {
        jwk,
      },
      iss: issuer,
      iat: Math.floor(new Date().getTime() / 1000),
      vct: '',
    }
    const credential = await agent.createSdJwtVc({
      credentialPayload,
      disclosureFrame,
    })
    const presentation = await agent.createSdJwtPresentation({
      presentation: credential.credential,
      presentationFrame: { given_name: true },
      kb: {
        payload: {
          aud: '1',
          iat: 1,
          nonce: '342',
        },
      },
    })
    expect(presentation).toBeDefined()
    const decoded = await decodeSdJwt(presentation.presentation, defaultGenerateDigest)
    expect(decoded.kbJwt).toBeDefined()
    expect(((decoded.kbJwt as KBJwt).payload as kbPayload).aud).toBe('1')
  })

  it('includes no holder reference', async () => {
    const newClaims = JSON.parse(JSON.stringify(claims))
    newClaims.sub = undefined
    const credentialPayload: SdJwtVcPayload = {
      ...newClaims,
      iss: issuer,
      iat: Math.floor(new Date().getTime() / 1000),
      vct: '',
    }
    const credential = await agent.createSdJwtVc({
      credentialPayload,
      disclosureFrame,
    })
    const presentation = agent.createSdJwtPresentation({
      presentation: credential.credential,
      presentationFrame: { given_name: true },
      kb: {
        payload: {
          aud: '1',
          iat: 1,
          nonce: '342',
        },
      },
    })
    await expect(presentation).rejects.toThrow('credential does not include a holder reference')
  })

  it('verify a presentation', async () => {
    const holderDId = await agent.resolveDid({ didUrl: holder })
    const jwk: JsonWebKey = ((holderDId.didDocument as DIDDocument).verificationMethod as VerificationMethod[])[0].publicKeyJwk as JsonWebKey
    const credentialPayload: SdJwtVcPayload = {
      ...claims,
      iss: issuer,
      iat: Math.floor(new Date().getTime() / 1000),
      vct: '',
      cnf: {
        jwk,
      },
    }
    const credential = await agent.createSdJwtVc({
      credentialPayload,
      disclosureFrame,
    })
    const presentation = await agent.createSdJwtPresentation({
      presentation: credential.credential,
      presentationFrame: { given_name: true },
      kb: {
        payload: {
          aud: '1',
          iat: 1,
          nonce: '342',
        },
      },
    })
    const result = await agent.verifySdJwtPresentation({
      presentation: presentation.presentation,
      requiredClaimKeys: ['given_name'],
      // we are not able to verify the kb yet since we have no reference to the public key of the holder.
      kb: true,
    })
    expect(result).toBeDefined()
    expect((result.payload as typeof claims).given_name).toBe('John')
  })

  it('verify a presentation with sub set', async () => {
    const holderDId = await agent.resolveDid({ didUrl: holder })
    const jwk: JsonWebKey = ((holderDId.didDocument as DIDDocument).verificationMethod as VerificationMethod[])[0].publicKeyJwk as JsonWebKey
    const credentialPayload: SdJwtVcPayload = {
      ...claims,
      iss: issuer,
      iat: Math.floor(new Date().getTime() / 1000),
      vct: '',
      cnf: {
        jwk,
      },
    }
    const credential = await agent.createSdJwtVc({
      credentialPayload,
      disclosureFrame,
    })
    const presentation = await agent.createSdJwtPresentation({
      presentation: credential.credential,
      presentationFrame: { given_name: true },
      kb: {
        payload: {
          aud: '1',
          iat: 1,
          nonce: '342',
        },
      },
    })
    const result = await agent.verifySdJwtPresentation({
      presentation: presentation.presentation,
      requiredClaimKeys: ['given_name'],
      // we are not able to verify the kb yet since we have no reference to the public key of the holder.
      kb: true,
    })
    expect(result).toBeDefined()
    expect((result.payload as typeof claims).given_name).toBe('John')
  })
})
