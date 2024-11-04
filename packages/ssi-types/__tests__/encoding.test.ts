import { createHash } from 'crypto'
import * as fs from 'fs'
import {
  CredentialMapper,
  decodeSdJwtVc,
  decodeSdJwtVcAsync,
  JoseCurve,
  JwkKeyType,
  IVerifiableCredential,
  IVerifiablePresentation,
  JWK,
  JwtDecodedVerifiableCredential,
  JwtDecodedVerifiablePresentation,
  OriginalVerifiableCredential,
  OriginalVerifiablePresentation,
  OriginalType,
  decodeMdocIssuerSigned,
  decodeMdocDeviceResponse,
} from '../src'

import { com } from '@sphereon/kmp-mdl-mdoc'

function getFile(path: string) {
  return fs.readFileSync(path, 'utf-8')
}

function getFileAsJson(path: string) {
  return JSON.parse(getFile(path))
}

describe('Encoding - Decoding', () => {
  const jwtVp: OriginalVerifiablePresentation = getFile('packages/ssi-types/__tests__/vc_vp_examples/vp/vp_universityDegree.jwt')
  const jwtVc: OriginalVerifiableCredential = getFile('packages/ssi-types/__tests__/vc_vp_examples/vc/vc_universityDegree.jwt')
  const ldpVp: OriginalVerifiablePresentation = getFileAsJson('packages/ssi-types/__tests__/vc_vp_examples/vp/vp_general.json')
  const ldpVc: OriginalVerifiableCredential = getFileAsJson('packages/ssi-types/__tests__/vc_vp_examples/vc/vc_driverLicense.json')

  const decodedJwtVp = CredentialMapper.decodeVerifiablePresentation(jwtVp) as JwtDecodedVerifiablePresentation
  const decodedJwtVc = CredentialMapper.decodeVerifiableCredential(jwtVc) as JwtDecodedVerifiableCredential
  const decodedLdpVp = CredentialMapper.decodeVerifiablePresentation(ldpVp) as IVerifiablePresentation
  const decodedLdpVc = CredentialMapper.decodeVerifiableCredential(ldpVc) as IVerifiableCredential

  it('Jwk enum test', () => {
    const jwk = {
      kty: JwkKeyType.EC,
      // @ts-ignore
      crv: 'P-256',
    } satisfies JWK
    expect(JoseCurve.P_256).toStrictEqual(jwk.crv)
  })

  it('Decoded Jwt VP should have sub', () => {
    expect(decodedJwtVp.iss).toEqual('did:example:ebfeb1f712ebc6f1c276e12ec21')
  })

  it('Decoded Jwt VC should have sub', () => {
    expect(decodedJwtVc.sub).toEqual('did:example:ebfeb1f712ebc6f1c276e12ec21')
  })

  it('Decoded JsonLd VP should have sub', () => {
    if (!Array.isArray(decodedLdpVp.verifiableCredential) || decodedLdpVp.verifiableCredential.length < 2) {
      throw Error('Should have at least 2 VCs')
    }
    expect((decodedLdpVp.verifiableCredential[1] as IVerifiableCredential).issuer).toEqual('did:foo:123')
  })
  it('Decoded Jsonld VC should have sub', () => {
    expect(decodedLdpVc.issuer).toEqual('did:key:z6MkuDyqwjCVhFFQEZdS5utguwYD2KRig2PEb9qbfP9iqwn9')
  })

  it('text-stringified JsonLD should be decoded', () => {
    const decodedVp = CredentialMapper.decodeVerifiablePresentation(JSON.stringify(ldpVp)) as IVerifiablePresentation
    const decodedVc = CredentialMapper.decodeVerifiableCredential(JSON.stringify(ldpVc)) as IVerifiableCredential
    expect(decodedVp.verifiableCredential).toBeDefined()
    expect(decodedVc.credentialSubject).toMatchObject({ id: 'did:example:b34ca6cd37bbf23' })
  })

  it('JWT encoding checks should succeed on JWTs', () => {
    expect(CredentialMapper.isJwtEncoded(jwtVp)).toEqual(true)
    expect(CredentialMapper.isJwtEncoded(jwtVc)).toEqual(true)
    expect(CredentialMapper.isJwtEncoded(ldpVp)).toEqual(false)
    expect(CredentialMapper.isJwtEncoded(ldpVc)).toEqual(false)
  })

  it('JWT decoding VP checks should succeed on decoded JWT VPs only', () => {
    expect(CredentialMapper.isJwtDecodedPresentation(decodedJwtVp)).toEqual(true)
    expect(CredentialMapper.isJwtDecodedPresentation(decodedJwtVc as never)).toEqual(false)
    expect(CredentialMapper.isJwtDecodedPresentation(decodedLdpVp as never)).toEqual(false)
    expect(CredentialMapper.isJwtDecodedPresentation(decodedLdpVc as never)).toEqual(false)

    expect(CredentialMapper.isJwtDecodedPresentation(jwtVp)).toEqual(false)
    expect(CredentialMapper.isJwtDecodedPresentation(jwtVc)).toEqual(false)
    expect(CredentialMapper.isJwtDecodedPresentation(ldpVp)).toEqual(false)
    expect(CredentialMapper.isJwtDecodedPresentation(JSON.stringify(ldpVc))).toEqual(false)
  })

  it('JWT decoding VC checks should succeed on decoded JWT VCs only', () => {
    expect(CredentialMapper.isJwtDecodedCredential(decodedJwtVc)).toEqual(true)
    expect(CredentialMapper.isJwtDecodedCredential(decodedJwtVp as never)).toEqual(false)
    expect(CredentialMapper.isJwtDecodedCredential(decodedLdpVp as never)).toEqual(false)
    expect(CredentialMapper.isJwtDecodedCredential(decodedLdpVc as never)).toEqual(false)

    expect(CredentialMapper.isJwtDecodedCredential(jwtVp)).toEqual(false)
    expect(CredentialMapper.isJwtDecodedCredential(jwtVc)).toEqual(false)
    expect(CredentialMapper.isJwtDecodedCredential(JSON.stringify(ldpVp))).toEqual(false)
    expect(CredentialMapper.isJwtDecodedCredential(ldpVc)).toEqual(false)
  })

  it('uniform presentation should be created from encoded Jwt', () => {
    const uniform = CredentialMapper.jwtEncodedPresentationToUniformPresentation(jwtVp)
    expect(uniform.verifiableCredential).toBeDefined()
  })

  it('uniform credential should be created from encoded Jwt', () => {
    const uniform = CredentialMapper.jwtEncodedCredentialToUniformCredential(jwtVc)
    expect(uniform.credentialSubject).toBeDefined()
  })

  it('uniform presentation should be created from decoded Jwt', () => {
    const uniform = CredentialMapper.jwtDecodedPresentationToUniformPresentation(decodedJwtVp)
    expect(uniform.verifiableCredential).toBeDefined()
  })

  it('uniform credential should be created from decoded Jwt', () => {
    const uniform = CredentialMapper.jwtDecodedCredentialToUniformCredential(decodedJwtVc)
    expect(uniform.credentialSubject).toBeDefined()
  })

  it('decode sd-jwt-vc', () => {
    const decoded = decodeSdJwtVc(
      'eyJhbGciOiJFZERTQSIsInR5cCI6InZjK3NkLWp3dCIsImtpZCI6IiN6Nk1rdHF0WE5HOENEVVk5UHJydG9TdEZ6ZUNuaHBNbWd4WUwxZ2lrY1czQnp2TlcifQ.eyJ2Y3QiOiJJZGVudGl0eUNyZWRlbnRpYWwiLCJmYW1pbHlfbmFtZSI6IkRvZSIsInBob25lX251bWJlciI6IisxLTIwMi01NTUtMDEwMSIsImFkZHJlc3MiOnsic3RyZWV0X2FkZHJlc3MiOiIxMjMgTWFpbiBTdCIsImxvY2FsaXR5IjoiQW55dG93biIsIl9zZCI6WyJOSm5tY3QwQnFCTUUxSmZCbEM2alJRVlJ1ZXZwRU9OaVl3N0E3TUh1SnlRIiwib201Wnp0WkhCLUdkMDBMRzIxQ1ZfeE00RmFFTlNvaWFPWG5UQUpOY3pCNCJdfSwiY25mIjp7Imp3ayI6eyJrdHkiOiJPS1AiLCJjcnYiOiJFZDI1NTE5IiwieCI6Im9FTlZzeE9VaUg1NFg4d0pMYVZraWNDUmswMHdCSVE0c1JnYms1NE44TW8ifX0sImlzcyI6ImRpZDprZXk6ejZNa3RxdFhORzhDRFVZOVBycnRvU3RGemVDbmhwTW1neFlMMWdpa2NXM0J6dk5XIiwiaWF0IjoxNjk4MTUxNTMyLCJfc2RfYWxnIjoic2hhLTI1NiIsIl9zZCI6WyIxQ3VyMmsyQTJvSUI1Q3NoU0lmX0FfS2ctbDI2dV9xS3VXUTc5UDBWZGFzIiwiUjF6VFV2T1lIZ2NlcGowakh5cEdIejlFSHR0VktmdDB5c3diYzlFVFBiVSIsImVEcVFwZFRYSlhiV2hmLUVzSTd6dzVYNk92WW1GTi1VWlFRTWVzWHdLUHciLCJwZERrMl9YQUtIbzdnT0Fmd0YxYjdPZENVVlRpdDJrSkhheFNFQ1E5eGZjIiwicHNhdUtVTldFaTA5bnUzQ2w4OXhLWGdtcFdFTlpsNXV5MU4xbnluX2pNayIsInNOX2dlMHBIWEY2cW1zWW5YMUE5U2R3SjhjaDhhRU5reGJPRHNUNzRZd0kiXX0.coOK8NzJmEWz4qx-qRhjo-RK7aejrSkQM9La9Cw3eWmzcja9DXrkBoQZKbIJtNoSzSPLjwK2V71W78z0miZsDQ~WyJzYWx0IiwiaXNfb3Zlcl82NSIsdHJ1ZV0~WyJzYWx0IiwiaXNfb3Zlcl8yMSIsdHJ1ZV0~WyJzYWx0IiwiZW1haWwiLCJqb2huZG9lQGV4YW1wbGUuY29tIl0~WyJzYWx0IiwiY291bnRyeSIsIlVTIl0~WyJzYWx0IiwiZ2l2ZW5fbmFtZSIsIkpvaG4iXQ~eyJhbGciOiJFZERTQSIsInR5cCI6ImtiK2p3dCJ9.eyJpYXQiOjE2OTgxNTE1MzIsIm5vbmNlIjoic2FsdCIsImF1ZCI6ImRpZDprZXk6elVDNzRWRXFxaEVIUWNndjR6YWdTUGtxRkp4dU5XdW9CUEtqSnVIRVRFVWVITG9TcVd0OTJ2aVNzbWFXank4MnkiLCJfc2RfaGFzaCI6Ii1kTUd4OGZhUnpOQm91a2EwU0R6V2JkS3JYckw1TFVmUlNQTHN2Q2xPMFkifQ.TQQLqc4ZzoKjQfAghAzC_4aaU3KCS8YqzxAJtzT124guzkv9XSHtPN8d3z181_v-ca2ATXjTRoRciozitE6wBA',
      (data, algorithm) => createHash(algorithm).update(data).digest()
    )

    expect(decoded).toEqual({
      compactSdJwtVc:
        'eyJhbGciOiJFZERTQSIsInR5cCI6InZjK3NkLWp3dCIsImtpZCI6IiN6Nk1rdHF0WE5HOENEVVk5UHJydG9TdEZ6ZUNuaHBNbWd4WUwxZ2lrY1czQnp2TlcifQ.eyJ2Y3QiOiJJZGVudGl0eUNyZWRlbnRpYWwiLCJmYW1pbHlfbmFtZSI6IkRvZSIsInBob25lX251bWJlciI6IisxLTIwMi01NTUtMDEwMSIsImFkZHJlc3MiOnsic3RyZWV0X2FkZHJlc3MiOiIxMjMgTWFpbiBTdCIsImxvY2FsaXR5IjoiQW55dG93biIsIl9zZCI6WyJOSm5tY3QwQnFCTUUxSmZCbEM2alJRVlJ1ZXZwRU9OaVl3N0E3TUh1SnlRIiwib201Wnp0WkhCLUdkMDBMRzIxQ1ZfeE00RmFFTlNvaWFPWG5UQUpOY3pCNCJdfSwiY25mIjp7Imp3ayI6eyJrdHkiOiJPS1AiLCJjcnYiOiJFZDI1NTE5IiwieCI6Im9FTlZzeE9VaUg1NFg4d0pMYVZraWNDUmswMHdCSVE0c1JnYms1NE44TW8ifX0sImlzcyI6ImRpZDprZXk6ejZNa3RxdFhORzhDRFVZOVBycnRvU3RGemVDbmhwTW1neFlMMWdpa2NXM0J6dk5XIiwiaWF0IjoxNjk4MTUxNTMyLCJfc2RfYWxnIjoic2hhLTI1NiIsIl9zZCI6WyIxQ3VyMmsyQTJvSUI1Q3NoU0lmX0FfS2ctbDI2dV9xS3VXUTc5UDBWZGFzIiwiUjF6VFV2T1lIZ2NlcGowakh5cEdIejlFSHR0VktmdDB5c3diYzlFVFBiVSIsImVEcVFwZFRYSlhiV2hmLUVzSTd6dzVYNk92WW1GTi1VWlFRTWVzWHdLUHciLCJwZERrMl9YQUtIbzdnT0Fmd0YxYjdPZENVVlRpdDJrSkhheFNFQ1E5eGZjIiwicHNhdUtVTldFaTA5bnUzQ2w4OXhLWGdtcFdFTlpsNXV5MU4xbnluX2pNayIsInNOX2dlMHBIWEY2cW1zWW5YMUE5U2R3SjhjaDhhRU5reGJPRHNUNzRZd0kiXX0.coOK8NzJmEWz4qx-qRhjo-RK7aejrSkQM9La9Cw3eWmzcja9DXrkBoQZKbIJtNoSzSPLjwK2V71W78z0miZsDQ~WyJzYWx0IiwiaXNfb3Zlcl82NSIsdHJ1ZV0~WyJzYWx0IiwiaXNfb3Zlcl8yMSIsdHJ1ZV0~WyJzYWx0IiwiZW1haWwiLCJqb2huZG9lQGV4YW1wbGUuY29tIl0~WyJzYWx0IiwiY291bnRyeSIsIlVTIl0~WyJzYWx0IiwiZ2l2ZW5fbmFtZSIsIkpvaG4iXQ~eyJhbGciOiJFZERTQSIsInR5cCI6ImtiK2p3dCJ9.eyJpYXQiOjE2OTgxNTE1MzIsIm5vbmNlIjoic2FsdCIsImF1ZCI6ImRpZDprZXk6elVDNzRWRXFxaEVIUWNndjR6YWdTUGtxRkp4dU5XdW9CUEtqSnVIRVRFVWVITG9TcVd0OTJ2aVNzbWFXank4MnkiLCJfc2RfaGFzaCI6Ii1kTUd4OGZhUnpOQm91a2EwU0R6V2JkS3JYckw1TFVmUlNQTHN2Q2xPMFkifQ.TQQLqc4ZzoKjQfAghAzC_4aaU3KCS8YqzxAJtzT124guzkv9XSHtPN8d3z181_v-ca2ATXjTRoRciozitE6wBA',
      decodedPayload: {
        address: {
          country: 'US',
          locality: 'Anytown',
          street_address: '123 Main St',
        },
        cnf: {
          jwk: {
            crv: 'Ed25519',
            kty: 'OKP',
            x: 'oENVsxOUiH54X8wJLaVkicCRk00wBIQ4sRgbk54N8Mo',
          },
        },
        email: 'johndoe@example.com',
        family_name: 'Doe',
        given_name: 'John',
        iat: 1698151532,
        is_over_21: true,
        is_over_65: true,
        iss: 'did:key:z6MktqtXNG8CDUY9PrrtoStFzeCnhpMmgxYL1gikcW3BzvNW',
        phone_number: '+1-202-555-0101',
        vct: 'IdentityCredential',
      },
      disclosures: [
        {
          decoded: ['salt', 'is_over_65', true],
          digest: 'sN_ge0pHXF6qmsYnX1A9SdwJ8ch8aENkxbODsT74YwI',
          encoded: 'WyJzYWx0IiwiaXNfb3Zlcl82NSIsdHJ1ZV0',
        },
        {
          decoded: ['salt', 'is_over_21', true],
          digest: 'R1zTUvOYHgcepj0jHypGHz9EHttVKft0yswbc9ETPbU',
          encoded: 'WyJzYWx0IiwiaXNfb3Zlcl8yMSIsdHJ1ZV0',
        },
        {
          decoded: ['salt', 'email', 'johndoe@example.com'],
          digest: 'psauKUNWEi09nu3Cl89xKXgmpWENZl5uy1N1nyn_jMk',
          encoded: 'WyJzYWx0IiwiZW1haWwiLCJqb2huZG9lQGV4YW1wbGUuY29tIl0',
        },
        {
          decoded: ['salt', 'country', 'US'],
          digest: 'om5ZztZHB-Gd00LG21CV_xM4FaENSoiaOXnTAJNczB4',
          encoded: 'WyJzYWx0IiwiY291bnRyeSIsIlVTIl0',
        },
        {
          decoded: ['salt', 'given_name', 'John'],
          digest: 'eDqQpdTXJXbWhf-EsI7zw5X6OvYmFN-UZQQMesXwKPw',
          encoded: 'WyJzYWx0IiwiZ2l2ZW5fbmFtZSIsIkpvaG4iXQ',
        },
      ],
      signedPayload: {
        _sd: [
          '1Cur2k2A2oIB5CshSIf_A_Kg-l26u_qKuWQ79P0Vdas',
          'R1zTUvOYHgcepj0jHypGHz9EHttVKft0yswbc9ETPbU',
          'eDqQpdTXJXbWhf-EsI7zw5X6OvYmFN-UZQQMesXwKPw',
          'pdDk2_XAKHo7gOAfwF1b7OdCUVTit2kJHaxSECQ9xfc',
          'psauKUNWEi09nu3Cl89xKXgmpWENZl5uy1N1nyn_jMk',
          'sN_ge0pHXF6qmsYnX1A9SdwJ8ch8aENkxbODsT74YwI',
        ],
        _sd_alg: 'sha-256',
        address: {
          _sd: ['NJnmct0BqBME1JfBlC6jRQVRuevpEONiYw7A7MHuJyQ', 'om5ZztZHB-Gd00LG21CV_xM4FaENSoiaOXnTAJNczB4'],
          locality: 'Anytown',
          street_address: '123 Main St',
        },
        cnf: {
          jwk: {
            crv: 'Ed25519',
            kty: 'OKP',
            x: 'oENVsxOUiH54X8wJLaVkicCRk00wBIQ4sRgbk54N8Mo',
          },
        },
        family_name: 'Doe',
        iat: 1698151532,
        iss: 'did:key:z6MktqtXNG8CDUY9PrrtoStFzeCnhpMmgxYL1gikcW3BzvNW',
        phone_number: '+1-202-555-0101',
        vct: 'IdentityCredential',
      },
      kbJwt: {
        compact:
          'eyJhbGciOiJFZERTQSIsInR5cCI6ImtiK2p3dCJ9.eyJpYXQiOjE2OTgxNTE1MzIsIm5vbmNlIjoic2FsdCIsImF1ZCI6ImRpZDprZXk6elVDNzRWRXFxaEVIUWNndjR6YWdTUGtxRkp4dU5XdW9CUEtqSnVIRVRFVWVITG9TcVd0OTJ2aVNzbWFXank4MnkiLCJfc2RfaGFzaCI6Ii1kTUd4OGZhUnpOQm91a2EwU0R6V2JkS3JYckw1TFVmUlNQTHN2Q2xPMFkifQ.TQQLqc4ZzoKjQfAghAzC_4aaU3KCS8YqzxAJtzT124guzkv9XSHtPN8d3z181_v-ca2ATXjTRoRciozitE6wBA',
        header: {
          alg: 'EdDSA',
          typ: 'kb+jwt',
        },
        payload: {
          _sd_hash: '-dMGx8faRzNBouka0SDzWbdKrXrL5LUfRSPLsvClO0Y',
          aud: 'did:key:zUC74VEqqhEHQcgv4zagSPkqFJxuNWuoBPKjJuHETEUeHLoSqWt92viSsmaWjy82y',
          iat: 1698151532,
          nonce: 'salt',
        },
      },
    })
  })

  it('decode sd-jwt-vc async', async () => {
    const decoded = await decodeSdJwtVcAsync(
      'eyJhbGciOiJFZERTQSIsInR5cCI6InZjK3NkLWp3dCIsImtpZCI6IiN6Nk1rdHF0WE5HOENEVVk5UHJydG9TdEZ6ZUNuaHBNbWd4WUwxZ2lrY1czQnp2TlcifQ.eyJ2Y3QiOiJJZGVudGl0eUNyZWRlbnRpYWwiLCJmYW1pbHlfbmFtZSI6IkRvZSIsInBob25lX251bWJlciI6IisxLTIwMi01NTUtMDEwMSIsImFkZHJlc3MiOnsic3RyZWV0X2FkZHJlc3MiOiIxMjMgTWFpbiBTdCIsImxvY2FsaXR5IjoiQW55dG93biIsIl9zZCI6WyJOSm5tY3QwQnFCTUUxSmZCbEM2alJRVlJ1ZXZwRU9OaVl3N0E3TUh1SnlRIiwib201Wnp0WkhCLUdkMDBMRzIxQ1ZfeE00RmFFTlNvaWFPWG5UQUpOY3pCNCJdfSwiY25mIjp7Imp3ayI6eyJrdHkiOiJPS1AiLCJjcnYiOiJFZDI1NTE5IiwieCI6Im9FTlZzeE9VaUg1NFg4d0pMYVZraWNDUmswMHdCSVE0c1JnYms1NE44TW8ifX0sImlzcyI6ImRpZDprZXk6ejZNa3RxdFhORzhDRFVZOVBycnRvU3RGemVDbmhwTW1neFlMMWdpa2NXM0J6dk5XIiwiaWF0IjoxNjk4MTUxNTMyLCJfc2RfYWxnIjoic2hhLTI1NiIsIl9zZCI6WyIxQ3VyMmsyQTJvSUI1Q3NoU0lmX0FfS2ctbDI2dV9xS3VXUTc5UDBWZGFzIiwiUjF6VFV2T1lIZ2NlcGowakh5cEdIejlFSHR0VktmdDB5c3diYzlFVFBiVSIsImVEcVFwZFRYSlhiV2hmLUVzSTd6dzVYNk92WW1GTi1VWlFRTWVzWHdLUHciLCJwZERrMl9YQUtIbzdnT0Fmd0YxYjdPZENVVlRpdDJrSkhheFNFQ1E5eGZjIiwicHNhdUtVTldFaTA5bnUzQ2w4OXhLWGdtcFdFTlpsNXV5MU4xbnluX2pNayIsInNOX2dlMHBIWEY2cW1zWW5YMUE5U2R3SjhjaDhhRU5reGJPRHNUNzRZd0kiXX0.coOK8NzJmEWz4qx-qRhjo-RK7aejrSkQM9La9Cw3eWmzcja9DXrkBoQZKbIJtNoSzSPLjwK2V71W78z0miZsDQ~WyJzYWx0IiwiaXNfb3Zlcl82NSIsdHJ1ZV0~WyJzYWx0IiwiaXNfb3Zlcl8yMSIsdHJ1ZV0~WyJzYWx0IiwiZW1haWwiLCJqb2huZG9lQGV4YW1wbGUuY29tIl0~WyJzYWx0IiwiY291bnRyeSIsIlVTIl0~WyJzYWx0IiwiZ2l2ZW5fbmFtZSIsIkpvaG4iXQ~eyJhbGciOiJFZERTQSIsInR5cCI6ImtiK2p3dCJ9.eyJpYXQiOjE2OTgxNTE1MzIsIm5vbmNlIjoic2FsdCIsImF1ZCI6ImRpZDprZXk6elVDNzRWRXFxaEVIUWNndjR6YWdTUGtxRkp4dU5XdW9CUEtqSnVIRVRFVWVITG9TcVd0OTJ2aVNzbWFXank4MnkiLCJfc2RfaGFzaCI6Ii1kTUd4OGZhUnpOQm91a2EwU0R6V2JkS3JYckw1TFVmUlNQTHN2Q2xPMFkifQ.TQQLqc4ZzoKjQfAghAzC_4aaU3KCS8YqzxAJtzT124guzkv9XSHtPN8d3z181_v-ca2ATXjTRoRciozitE6wBA',
      (data, algorithm) => Promise.resolve(createHash(algorithm).update(data).digest())
    )

    expect(decoded).toEqual({
      compactSdJwtVc:
        'eyJhbGciOiJFZERTQSIsInR5cCI6InZjK3NkLWp3dCIsImtpZCI6IiN6Nk1rdHF0WE5HOENEVVk5UHJydG9TdEZ6ZUNuaHBNbWd4WUwxZ2lrY1czQnp2TlcifQ.eyJ2Y3QiOiJJZGVudGl0eUNyZWRlbnRpYWwiLCJmYW1pbHlfbmFtZSI6IkRvZSIsInBob25lX251bWJlciI6IisxLTIwMi01NTUtMDEwMSIsImFkZHJlc3MiOnsic3RyZWV0X2FkZHJlc3MiOiIxMjMgTWFpbiBTdCIsImxvY2FsaXR5IjoiQW55dG93biIsIl9zZCI6WyJOSm5tY3QwQnFCTUUxSmZCbEM2alJRVlJ1ZXZwRU9OaVl3N0E3TUh1SnlRIiwib201Wnp0WkhCLUdkMDBMRzIxQ1ZfeE00RmFFTlNvaWFPWG5UQUpOY3pCNCJdfSwiY25mIjp7Imp3ayI6eyJrdHkiOiJPS1AiLCJjcnYiOiJFZDI1NTE5IiwieCI6Im9FTlZzeE9VaUg1NFg4d0pMYVZraWNDUmswMHdCSVE0c1JnYms1NE44TW8ifX0sImlzcyI6ImRpZDprZXk6ejZNa3RxdFhORzhDRFVZOVBycnRvU3RGemVDbmhwTW1neFlMMWdpa2NXM0J6dk5XIiwiaWF0IjoxNjk4MTUxNTMyLCJfc2RfYWxnIjoic2hhLTI1NiIsIl9zZCI6WyIxQ3VyMmsyQTJvSUI1Q3NoU0lmX0FfS2ctbDI2dV9xS3VXUTc5UDBWZGFzIiwiUjF6VFV2T1lIZ2NlcGowakh5cEdIejlFSHR0VktmdDB5c3diYzlFVFBiVSIsImVEcVFwZFRYSlhiV2hmLUVzSTd6dzVYNk92WW1GTi1VWlFRTWVzWHdLUHciLCJwZERrMl9YQUtIbzdnT0Fmd0YxYjdPZENVVlRpdDJrSkhheFNFQ1E5eGZjIiwicHNhdUtVTldFaTA5bnUzQ2w4OXhLWGdtcFdFTlpsNXV5MU4xbnluX2pNayIsInNOX2dlMHBIWEY2cW1zWW5YMUE5U2R3SjhjaDhhRU5reGJPRHNUNzRZd0kiXX0.coOK8NzJmEWz4qx-qRhjo-RK7aejrSkQM9La9Cw3eWmzcja9DXrkBoQZKbIJtNoSzSPLjwK2V71W78z0miZsDQ~WyJzYWx0IiwiaXNfb3Zlcl82NSIsdHJ1ZV0~WyJzYWx0IiwiaXNfb3Zlcl8yMSIsdHJ1ZV0~WyJzYWx0IiwiZW1haWwiLCJqb2huZG9lQGV4YW1wbGUuY29tIl0~WyJzYWx0IiwiY291bnRyeSIsIlVTIl0~WyJzYWx0IiwiZ2l2ZW5fbmFtZSIsIkpvaG4iXQ~eyJhbGciOiJFZERTQSIsInR5cCI6ImtiK2p3dCJ9.eyJpYXQiOjE2OTgxNTE1MzIsIm5vbmNlIjoic2FsdCIsImF1ZCI6ImRpZDprZXk6elVDNzRWRXFxaEVIUWNndjR6YWdTUGtxRkp4dU5XdW9CUEtqSnVIRVRFVWVITG9TcVd0OTJ2aVNzbWFXank4MnkiLCJfc2RfaGFzaCI6Ii1kTUd4OGZhUnpOQm91a2EwU0R6V2JkS3JYckw1TFVmUlNQTHN2Q2xPMFkifQ.TQQLqc4ZzoKjQfAghAzC_4aaU3KCS8YqzxAJtzT124guzkv9XSHtPN8d3z181_v-ca2ATXjTRoRciozitE6wBA',
      decodedPayload: {
        address: {
          country: 'US',
          locality: 'Anytown',
          street_address: '123 Main St',
        },
        cnf: {
          jwk: {
            crv: 'Ed25519',
            kty: 'OKP',
            x: 'oENVsxOUiH54X8wJLaVkicCRk00wBIQ4sRgbk54N8Mo',
          },
        },
        email: 'johndoe@example.com',
        family_name: 'Doe',
        given_name: 'John',
        iat: 1698151532,
        is_over_21: true,
        is_over_65: true,
        iss: 'did:key:z6MktqtXNG8CDUY9PrrtoStFzeCnhpMmgxYL1gikcW3BzvNW',
        phone_number: '+1-202-555-0101',
        vct: 'IdentityCredential',
      },
      disclosures: [
        {
          decoded: ['salt', 'is_over_65', true],
          digest: 'sN_ge0pHXF6qmsYnX1A9SdwJ8ch8aENkxbODsT74YwI',
          encoded: 'WyJzYWx0IiwiaXNfb3Zlcl82NSIsdHJ1ZV0',
        },
        {
          decoded: ['salt', 'is_over_21', true],
          digest: 'R1zTUvOYHgcepj0jHypGHz9EHttVKft0yswbc9ETPbU',
          encoded: 'WyJzYWx0IiwiaXNfb3Zlcl8yMSIsdHJ1ZV0',
        },
        {
          decoded: ['salt', 'email', 'johndoe@example.com'],
          digest: 'psauKUNWEi09nu3Cl89xKXgmpWENZl5uy1N1nyn_jMk',
          encoded: 'WyJzYWx0IiwiZW1haWwiLCJqb2huZG9lQGV4YW1wbGUuY29tIl0',
        },
        {
          decoded: ['salt', 'country', 'US'],
          digest: 'om5ZztZHB-Gd00LG21CV_xM4FaENSoiaOXnTAJNczB4',
          encoded: 'WyJzYWx0IiwiY291bnRyeSIsIlVTIl0',
        },
        {
          decoded: ['salt', 'given_name', 'John'],
          digest: 'eDqQpdTXJXbWhf-EsI7zw5X6OvYmFN-UZQQMesXwKPw',
          encoded: 'WyJzYWx0IiwiZ2l2ZW5fbmFtZSIsIkpvaG4iXQ',
        },
      ],
      signedPayload: {
        _sd: [
          '1Cur2k2A2oIB5CshSIf_A_Kg-l26u_qKuWQ79P0Vdas',
          'R1zTUvOYHgcepj0jHypGHz9EHttVKft0yswbc9ETPbU',
          'eDqQpdTXJXbWhf-EsI7zw5X6OvYmFN-UZQQMesXwKPw',
          'pdDk2_XAKHo7gOAfwF1b7OdCUVTit2kJHaxSECQ9xfc',
          'psauKUNWEi09nu3Cl89xKXgmpWENZl5uy1N1nyn_jMk',
          'sN_ge0pHXF6qmsYnX1A9SdwJ8ch8aENkxbODsT74YwI',
        ],
        _sd_alg: 'sha-256',
        address: {
          _sd: ['NJnmct0BqBME1JfBlC6jRQVRuevpEONiYw7A7MHuJyQ', 'om5ZztZHB-Gd00LG21CV_xM4FaENSoiaOXnTAJNczB4'],
          locality: 'Anytown',
          street_address: '123 Main St',
        },
        cnf: {
          jwk: {
            crv: 'Ed25519',
            kty: 'OKP',
            x: 'oENVsxOUiH54X8wJLaVkicCRk00wBIQ4sRgbk54N8Mo',
          },
        },
        family_name: 'Doe',
        iat: 1698151532,
        iss: 'did:key:z6MktqtXNG8CDUY9PrrtoStFzeCnhpMmgxYL1gikcW3BzvNW',
        phone_number: '+1-202-555-0101',
        vct: 'IdentityCredential',
      },
      kbJwt: {
        compact:
          'eyJhbGciOiJFZERTQSIsInR5cCI6ImtiK2p3dCJ9.eyJpYXQiOjE2OTgxNTE1MzIsIm5vbmNlIjoic2FsdCIsImF1ZCI6ImRpZDprZXk6elVDNzRWRXFxaEVIUWNndjR6YWdTUGtxRkp4dU5XdW9CUEtqSnVIRVRFVWVITG9TcVd0OTJ2aVNzbWFXank4MnkiLCJfc2RfaGFzaCI6Ii1kTUd4OGZhUnpOQm91a2EwU0R6V2JkS3JYckw1TFVmUlNQTHN2Q2xPMFkifQ.TQQLqc4ZzoKjQfAghAzC_4aaU3KCS8YqzxAJtzT124guzkv9XSHtPN8d3z181_v-ca2ATXjTRoRciozitE6wBA',
        header: {
          alg: 'EdDSA',
          typ: 'kb+jwt',
        },
        payload: {
          _sd_hash: '-dMGx8faRzNBouka0SDzWbdKrXrL5LUfRSPLsvClO0Y',
          aud: 'did:key:zUC74VEqqhEHQcgv4zagSPkqFJxuNWuoBPKjJuHETEUeHLoSqWt92viSsmaWjy82y',
          iat: 1698151532,
          nonce: 'salt',
        },
      },
    })
  })

  it('decode OWF identity credential repoistory device response', () => {
    // https://github.com/openwallet-foundation-labs/identity-credential/blob/8a7428265aeafb7e0a3b52fba63576937ca11890/identity-mdoc/src/commonTest/kotlin/com/android/identity/mdoc/TestVectors.kt#L30C5-L36C31
    const encoded =
      'a36776657273696f6e63312e3069646f63756d656e747381a367646f6354797065756f72672e69736f2e31383031332e352e312e6d444c6c6973737565725369676e6564a26a6e616d65537061636573a1716f72672e69736f2e31383031332e352e3186d8185863a4686469676573744944006672616e646f6d58208798645b20ea200e19ffabac92624bee6aec63aceedecfb1b80077d22bfc20e971656c656d656e744964656e7469666965726b66616d696c795f6e616d656c656c656d656e7456616c756563446f65d818586ca4686469676573744944036672616e646f6d5820b23f627e8999c706df0c0a4ed98ad74af988af619b4bb078b89058553f44615d71656c656d656e744964656e7469666965726a69737375655f646174656c656c656d656e7456616c7565d903ec6a323031392d31302d3230d818586da4686469676573744944046672616e646f6d5820c7ffa307e5de921e67ba5878094787e8807ac8e7b5b3932d2ce80f00f3e9abaf71656c656d656e744964656e7469666965726b6578706972795f646174656c656c656d656e7456616c7565d903ec6a323032342d31302d3230d818586da4686469676573744944076672616e646f6d582026052a42e5880557a806c1459af3fb7eb505d3781566329d0b604b845b5f9e6871656c656d656e744964656e7469666965726f646f63756d656e745f6e756d6265726c656c656d656e7456616c756569313233343536373839d818590471a4686469676573744944086672616e646f6d5820d094dad764a2eb9deb5210e9d899643efbd1d069cc311d3295516ca0b024412d71656c656d656e744964656e74696669657268706f7274726169746c656c656d656e7456616c7565590412ffd8ffe000104a46494600010101009000900000ffdb004300130d0e110e0c13110f11151413171d301f1d1a1a1d3a2a2c2330453d4947443d43414c566d5d4c51685241435f82606871757b7c7b4a5c869085778f6d787b76ffdb0043011415151d191d381f1f38764f434f7676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676ffc00011080018006403012200021101031101ffc4001b00000301000301000000000000000000000005060401020307ffc400321000010303030205020309000000000000010203040005110612211331141551617122410781a1163542527391b2c1f1ffc4001501010100000000000000000000000000000001ffc4001a110101010003010000000000000000000000014111213161ffda000c03010002110311003f00a5bbde22da2329c7d692bc7d0d03f52cfb0ff75e7a7ef3e7709723a1d0dae146ddfbb3c039ce07ad2bd47a7e32dbb8dd1d52d6ef4b284f64a480067dfb51f87ffb95ff00eb9ff14d215de66af089ce44b7dbde9cb6890a2838eddf18078f7add62d411ef4db9b10a65d6b95a147381ea0d495b933275fe6bba75c114104a8ba410413e983dff004f5af5d34b4b4cde632d0bf1fd1592bdd91c6411f3934c2fa6af6b54975d106dcf4a65ae56e856001ebc03c7ce29dd9eef1ef10fc447dc9da76ad2aee93537a1ba7e4f70dd8eff0057c6dffb5e1a19854a83758e54528750946ec6704850cd037bceb08b6d7d2cc76d3317fc7b5cc04fb6707269c5c6e0c5b60ae549242123b0e493f602a075559e359970d98db89525456b51c951c8afa13ea8e98e3c596836783d5c63f5a61a99fdb7290875db4be88ab384bbbbbfc7183fdeaa633e8951db7da396dc48524fb1a8bd611a5aa2a2432f30ab420a7a6d3240c718cf031fa9ef4c9ad550205aa02951df4a1d6c8421b015b769db8c9229837ea2be8b1b0d39d0eba9c51484efdb8c0efd8d258daf3c449699f2edbd4584e7af9c64e3f96b9beb28d4ac40931e6478c8e76a24a825449501d867d2b1dcdebae99b9c752ae4ecd6dde4a179c1c1e460938f9149ef655e515c03919a289cb3dca278fb7bf177f4faa829dd8ce3f2ac9a7ecde490971fafd7dce15eed9b71c018c64fa514514b24e8e4f8c5c9b75c1e82579dc1233dfec08238f6add62d391acc1c5256a79e706d52d431c7a0145140b9fd149eb3a60dc5e88cbbc2da092411e9dc71f39a7766b447b344e847dcac9dcb5abba8d145061d43a6fcf1e65cf15d0e90231d3dd9cfe62995c6dcc5ca12a2c904a15f71dd27d451453e09d1a21450961cbb3ea8a956433b781f1ce33dfed54f0e2b50a2b71d84ed6db18028a28175f74fc6bda105c529a791c25c4f3c7a11f71586268f4a66b726e33de9ea6f1b52b181c760724e47b514520a5a28a283ffd9d81858ffa4686469676573744944096672616e646f6d58204599f81beaa2b20bd0ffcc9aa03a6f985befab3f6beaffa41e6354cdb2ab2ce471656c656d656e744964656e7469666965727264726976696e675f70726976696c656765736c656c656d656e7456616c756582a37576656869636c655f63617465676f72795f636f646561416a69737375655f64617465d903ec6a323031382d30382d30396b6578706972795f64617465d903ec6a323032342d31302d3230a37576656869636c655f63617465676f72795f636f646561426a69737375655f64617465d903ec6a323031372d30322d32336b6578706972795f64617465d903ec6a323032342d31302d32306a697373756572417574688443a10126a118215901f3308201ef30820195a00302010202143c4416eed784f3b413e48f56f075abfa6d87eb84300a06082a8648ce3d04030230233114301206035504030c0b75746f7069612069616361310b3009060355040613025553301e170d3230313030313030303030305a170d3231313030313030303030305a30213112301006035504030c0975746f706961206473310b30090603550406130255533059301306072a8648ce3d020106082a8648ce3d03010703420004ace7ab7340e5d9648c5a72a9a6f56745c7aad436a03a43efea77b5fa7b88f0197d57d8983e1b37d3a539f4d588365e38cbbf5b94d68c547b5bc8731dcd2f146ba381a83081a5301e0603551d120417301581136578616d706c65406578616d706c652e636f6d301c0603551d1f041530133011a00fa00d820b6578616d706c652e636f6d301d0603551d0e0416041414e29017a6c35621ffc7a686b7b72db06cd12351301f0603551d2304183016801454fa2383a04c28e0d930792261c80c4881d2c00b300e0603551d0f0101ff04040302078030150603551d250101ff040b3009060728818c5d050102300a06082a8648ce3d040302034800304502210097717ab9016740c8d7bcdaa494a62c053bbdecce1383c1aca72ad08dbc04cbb202203bad859c13a63c6d1ad67d814d43e2425caf90d422422c04a8ee0304c0d3a68d5903a2d81859039da66776657273696f6e63312e306f646967657374416c676f726974686d675348412d3235366c76616c756544696765737473a2716f72672e69736f2e31383031332e352e31ad00582075167333b47b6c2bfb86eccc1f438cf57af055371ac55e1e359e20f254adcebf01582067e539d6139ebd131aef441b445645dd831b2b375b390ca5ef6279b205ed45710258203394372ddb78053f36d5d869780e61eda313d44a392092ad8e0527a2fbfe55ae0358202e35ad3c4e514bb67b1a9db51ce74e4cb9b7146e41ac52dac9ce86b8613db555045820ea5c3304bb7c4a8dcb51c4c13b65264f845541341342093cca786e058fac2d59055820fae487f68b7a0e87a749774e56e9e1dc3a8ec7b77e490d21f0e1d3475661aa1d0658207d83e507ae77db815de4d803b88555d0511d894c897439f5774056416a1c7533075820f0549a145f1cf75cbeeffa881d4857dd438d627cf32174b1731c4c38e12ca936085820b68c8afcb2aaf7c581411d2877def155be2eb121a42bc9ba5b7312377e068f660958200b3587d1dd0c2a07a35bfb120d99a0abfb5df56865bb7fa15cc8b56a66df6e0c0a5820c98a170cf36e11abb724e98a75a5343dfa2b6ed3df2ecfbb8ef2ee55dd41c8810b5820b57dd036782f7b14c6a30faaaae6ccd5054ce88bdfa51a016ba75eda1edea9480c5820651f8736b18480fe252a03224ea087b5d10ca5485146c67c74ac4ec3112d4c3a746f72672e69736f2e31383031332e352e312e5553a4005820d80b83d25173c484c5640610ff1a31c949c1d934bf4cf7f18d5223b15dd4f21c0158204d80e1e2e4fb246d97895427ce7000bb59bb24c8cd003ecf94bf35bbd2917e340258208b331f3b685bca372e85351a25c9484ab7afcdf0d2233105511f778d98c2f544035820c343af1bd1690715439161aba73702c474abf992b20c9fb55c36a336ebe01a876d6465766963654b6579496e666fa1696465766963654b6579a40102200121582096313d6c63e24e3372742bfdb1a33ba2c897dcd68ab8c753e4fbd48dca6b7f9a2258201fb3269edd418857de1b39a4e4a44b92fa484caa722c228288f01d0c03a2c3d667646f6354797065756f72672e69736f2e31383031332e352e312e6d444c6c76616c6964697479496e666fa3667369676e6564c074323032302d31302d30315431333a33303a30325a6976616c696446726f6dc074323032302d31302d30315431333a33303a30325a6a76616c6964556e74696cc074323032312d31302d30315431333a33303a30325a584059e64205df1e2f708dd6db0847aed79fc7c0201d80fa55badcaf2e1bcf5902e1e5a62e4832044b890ad85aa53f129134775d733754d7cb7a413766aeff13cb2e6c6465766963655369676e6564a26a6e616d65537061636573d81841a06a64657669636541757468a1696465766963654d61638443a10105a0f65820e99521a85ad7891b806a07f8b5388a332d92c189a7bf293ee1f543405ae6824d6673746174757300'
    const base64Encoded = Buffer.from(encoded, 'hex').toString('base64url')
    const wrapped = CredentialMapper.toWrappedVerifiablePresentation(base64Encoded)

    expect(wrapped).toEqual({
      type: OriginalType.MSO_MDOC_ENCODED,
      format: 'mso_mdoc',
      original: base64Encoded,
      presentation: expect.any(com.sphereon.mdoc.data.device.DeviceResponseCbor),
      decoded: expect.any(com.sphereon.mdoc.data.device.DeviceResponseCbor),
      vcs: [
        {
          type: OriginalType.MSO_MDOC_DECODED,
          format: 'mso_mdoc',
          original: expect.any(com.sphereon.mdoc.data.device.DocumentCbor),
          credential: expect.any(com.sphereon.mdoc.data.device.DocumentCbor),
          decoded: {
            'org.iso.18013.5.1': {
              document_number: '123456789',
              driving_privileges: undefined,
              expiry_date: '2024-10-20',
              family_name: 'Doe',
              issue_date: '2019-10-20',
              portrait:
                '_9j_4AAQSkZJRgABAQEAkACQAAD_2wBDABMNDhEODBMRDxEVFBMXHTAfHRoaHToqLCMwRT1JR0Q9Q0FMVm1dTFFoUkFDX4JgaHF1e3x7SlyGkIV3j214e3b_2wBDARQVFR0ZHTgfHzh2T0NPdnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnb_wAARCAAYAGQDASIAAhEBAxEB_8QAGwAAAwEAAwEAAAAAAAAAAAAAAAUGBAECAwf_xAAyEAABAwMDAgUCAwkAAAAAAAABAgMEAAURBhIhEzEUFVFhcSJBB4GhFjVCUnORssHx_8QAFQEBAQAAAAAAAAAAAAAAAAAAAAH_xAAaEQEBAQADAQAAAAAAAAAAAAAAAUERITFh_9oADAMBAAIRAxEAPwClu94i2iMpx9aSvH0NA_Us-w_3Xnp-8-dwlyOh0NrhRt37s8A5zgetK9R6fjLbuN0dUtbvSyhPZKSABn37Ufh_-5X_AOuf8U0hXeZq8InORLfb3py2iQooOO3fGAePet1i1BHvTbmxCmXWuVoUc4HqDUlbkzJ1_mu6dcEUEEqLpBBBPpg9_wBPWvXTS0tM3mMtC_H9FZK92RxkEfOTTC-mr2tUl10Qbc9KZa5W6FYAHrwDx84p3Z7vHvEPxEfcnadq0q7pNTehun5PcN2O_wBXxt_7XhoZhUqDdY5UUodQlG7GcEhQzQN7zrCLbX0sx20zF_x7XMBPtnByacXG4MW2CuVJJCEjsOST9gKgdVWeNZlw2Y24lSVFa1HJUcivoT6o6Y48WWg2eD1cY_WmGpn9tykIddtL6IqzhLu7v8cYP96qYz6JUdt9o5bcSFJPsai9YRpaoqJDLzCrQgp6bTJAxxjPAx-p70ya1VAgWqApUd9KHWyEIbAVt2nbjJIpg36ivosbDTnQ66nFFITv24wO_Y0lja88RJaZ8u29RYTnr5xk4_lrm-so1KxAkx5keMjnaiSoJUSVAdhn0rHc3rrpm5x1KuTs1t3koXnBweRgk4-RSe9lXlFcA5GaKJyz3KJ4-3vxd_T6qCndjOPyrJp-zeSQlx-v19zhXu2bccAYxk-lFFFLJOjk-MXJt1wegledwSM9_sCCOPat1i05GswcUlannnBtUtQxx6AUUUC5_RSes6YNxeiMu8LaCSQR6dxx85p3ZrRHs0ToR9ysnctau6jRRQYdQ6b88eZc8V0OkCMdPdnP5imVxtzFyhKiyQShX3HdJ9RRRT4J0aIUUJYcuz6oqVZDO3gfHOM9_tVPDitQorcdhO1tsYAoooF190_GvaEFxSmnkcJcTzx6EfcVhiaPSma3JuM96epvG1Kxgcdgck5HtRRSClooooP_2Q',
            },
          },
        },
      ],
    })
  })

  it('decode university mdoc device response from Credo', () => {
    const encoded =
      'uQADZ3ZlcnNpb25jMS4waWRvY3VtZW50c4GjZ2RvY1R5cGVxb3JnLmV1LnVuaXZlcnNpdHlsaXNzdWVyU2lnbmVkuQACam5hbWVTcGFjZXOhd2V1LmV1cm9wYS5lYy5ldWRpLnBpZC4xgtgYWGGkaGRpZ2VzdElEAnFlbGVtZW50SWRlbnRpZmllcmRuYW1lbGVsZW1lbnRWYWx1ZWhKb2huIERvZWZyYW5kb21YICTUPEzNlBwbcWWOXijZrs4Ed37zoxDCKJYvv0qKtpuv2BhYY6RoZGlnZXN0SUQBcWVsZW1lbnRJZGVudGlmaWVyZmRlZ3JlZWxlbGVtZW50VmFsdWVoYmFjaGVsb3JmcmFuZG9tWCC6uRVoNoBBcj5b-IEDTCUFoNEGVGsMSZP-3YuMUVCKrGppc3N1ZXJBdXRohEOhASaiBFgxekRuYWV0bk5naHRrNHk1VzFDNGpBM3E4VmRYbzhlUzNpWWViRm5MR3I3ZlhTYVVUNhghgVj8MIH5MIGgoAMCAQICEF36OiPSysIvMaLWuTCava8wCgYIKoZIzj0EAwIwDTELMAkGA1UEBhMCREUwHhcNMjQxMDMwMTI1ODQ0WhcNMjUxMDMwMTI1ODQ0WjANMQswCQYDVQQGEwJERTA5MBMGByqGSM49AgEGCCqGSM49AwEHAyIAA6VBlDzOG438-hsPWMSY56vJWrz8m5OaIimg0rG0vY6towIwADAKBggqhkjOPQQDAgNIADBFAiBc_30LjkQFX9YxWUyYH5jFK4Smw2h4KKYU85BBH2xDTAIhAKqb7RwT5_qoVJNYcom0x3N1eVd49TuPZfkbNaZsmhi5WQHd2BhZAdi5AAZndmVyc2lvbmMxLjBvZGlnZXN0QWxnb3JpdGhtZ1NIQS0yNTZsdmFsdWVEaWdlc3RzoXdldS5ldXJvcGEuZWMuZXVkaS5waWQuMaQAWCDrF96Sw8aHk1fZ8B92ZQE7I37MHjVSDoEq4MGhHuMIcwFYIAEsfqF7G_6k-lw2NKPRwHlWSalgrYsbXdcqz1ghPa-nAlggGq9DTWd1xmO8O84B0PCKhtf0daiT34V4xkU-wSGHYUwDWCDX5TNczi_TZSwmJ1VVeEzXpKXR9eweibocvAfpmKHEU21kZXZpY2VLZXlJbmZvuQABaWRldmljZUtleaQBAiABIVggN4_nyaOESmuHV8xhsUl2VqxaF83kIraAc2GV7M2-BKEiWCC0GqqvYnJ6U12ccZVDAOH8CeNGs9oOAF46jXJfauTSO2dkb2NUeXBlcW9yZy5ldS51bml2ZXJzaXR5bHZhbGlkaXR5SW5mb7kABGZzaWduZWTAdDIwMjQtMTAtMzBUMTI6NTg6NDRaaXZhbGlkRnJvbcB0MjAyNC0xMC0zMFQxMjo1ODo0NFpqdmFsaWRVbnRpbMB0MjAyNS0xMC0zMFQxMjo1ODo0NFpuZXhwZWN0ZWRVcGRhdGX3WEC3VoysIcxum_HtX5OCFEA3BwzhHcYmESJDzY58vz0Ez7Zo3fmP3D0M8evzMk7_Cz7_hwVL8sdLgiKpho5UXrunbGRldmljZVNpZ25lZLkAAmpuYW1lU3BhY2Vz2BhDuQAAamRldmljZUF1dGi5AAJvZGV2aWNlU2lnbmF0dXJlhEOhASag91hA9peGbzwyivN7UXvk4smItYMdt-RvcU87ZvXdDfRqIQsWSxGLcke2lHcit77fIEAw_8w0MOzM7ObQWK3T4vTMl2lkZXZpY2VNYWP3ZnN0YXR1cwA'
    const wrapped = CredentialMapper.toWrappedVerifiablePresentation(encoded)

    expect(wrapped).toEqual({
      type: OriginalType.MSO_MDOC_ENCODED,
      format: 'mso_mdoc',
      original: encoded,
      presentation: expect.any(com.sphereon.mdoc.data.device.DeviceResponseCbor),
      decoded: expect.any(com.sphereon.mdoc.data.device.DeviceResponseCbor),
      vcs: [
        {
          type: OriginalType.MSO_MDOC_DECODED,
          format: 'mso_mdoc',
          original: expect.any(com.sphereon.mdoc.data.device.DocumentCbor),
          credential: expect.any(com.sphereon.mdoc.data.device.DocumentCbor),
          decoded: {
            'eu.europa.ec.eudi.pid.1': {
              degree: 'bachelor',
              name: 'John Doe',
            },
          },
        },
      ],
    })
  })

  it('decode university mdoc', () => {
    const encoded =
      'uQACam5hbWVTcGFjZXOhanVuaXZlcnNpdHmE2BhYZqRoZGlnZXN0SUQAcWVsZW1lbnRJZGVudGlmaWVyaGxvY2F0aW9ubGVsZW1lbnRWYWx1ZWlpbm5zYnJ1Y2tmcmFuZG9tWCAw6CXtd4ubXAr6uLB1GnfRyHVqhjH1_73iDASmcZefQtgYWGOkaGRpZ2VzdElEAXFlbGVtZW50SWRlbnRpZmllcmZkZWdyZWVsZWxlbWVudFZhbHVlaGJhY2hlbG9yZnJhbmRvbVgglzuY8jgQd7y_wuH47AYfzlEfzz827RRjo4k845nK5DLYGFhhpGhkaWdlc3RJRAJxZWxlbWVudElkZW50aWZpZXJkbmFtZWxlbGVtZW50VmFsdWVoSm9obiBEb2VmcmFuZG9tWCDtU0gwjxNPz1q2AjgYWkAGWSHDq7BsXzns_aMMNeVkE9gYWGGkaGRpZ2VzdElEA3FlbGVtZW50SWRlbnRpZmllcmNub3RsZWxlbWVudFZhbHVlaWRpc2Nsb3NlZGZyYW5kb21YICSQ7u_6OBRr8V3c5hmIeL-NKBPEaUGWPxkv8TwTPdTbamlzc3VlckF1dGiEQ6EBJqIEWDF6RG5hZWRydmd5bXpvZnhvYTRWb1VDOFJRemdwMVJnZnBCTkw1SFZuV1NKb1oyeXJhGCGBWPwwgfkwgaCgAwIBAgIQTWQTeD9zo_1knyJtFXU2hzAKBggqhkjOPQQDAjANMQswCQYDVQQGEwJERTAeFw0yNDEwMzAxNDA5MDRaFw0yNTEwMzAxNDA5MDRaMA0xCzAJBgNVBAYTAkRFMDkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDIgACx4zJR4xIci9iFJPsMUX-mu4Khh63a_hjQKef7NyM2cOjAjAAMAoGCCqGSM49BAMCA0gAMEUCIQCRXFKtPshVsgBYMjH1-VA2sU2bphzWRLYrYvALfGTBdQIgLHF1n5J7KAiDhPTjmx3xxBlCVMYan_SKqXKxZVuO1M1ZAdDYGFkBy7kABmd2ZXJzaW9uYzEuMG9kaWdlc3RBbGdvcml0aG1nU0hBLTI1Nmx2YWx1ZURpZ2VzdHOhanVuaXZlcnNpdHmkAFggkN_ol8cnR2iCh3YLAYSt_-gt_hUT9ZIlm1LCS2kHW3gBWCAz2zbutIrJdbeAGi1T64jyst4PtE9WwjJK2-py9dyafQJYIHoRBZqOeV9IhNcbYsK46RaA95WyT7mq6-yqoh6j6Ds-A1ggwzOqmOGhsmiCMaEugAowlgUkzNxl0tD4CgbIx5u1Xx9tZGV2aWNlS2V5SW5mb7kAAWlkZXZpY2VLZXmkAQIgASFYIHhQ3snZrFRdtxGAB4HPsgmtZXHpzztrXjQXPRurqHtwIlggG9V2VQ1XAa9BRwxpgguzfhtP0gz8M52TWYDLwbe0P4ZnZG9jVHlwZXFvcmcuZXUudW5pdmVyc2l0eWx2YWxpZGl0eUluZm-5AARmc2lnbmVkwHQyMDI0LTEwLTMwVDE0OjA5OjA0Wml2YWxpZEZyb23AdDIwMjQtMTAtMzBUMTQ6MDk6MDRaanZhbGlkVW50aWzAdDIwMjUtMTAtMzBUMTQ6MDk6MDRabmV4cGVjdGVkVXBkYXRl91hAjkeOGOUm0CToTYOf0x3mtHFIzwT_LTHUYvcWaWrksmBOuUgZekkHAo9Bl9UTI0NKhEBIbKv9mGWHwJUgQ_1AIw'
    const wrapped = CredentialMapper.toWrappedVerifiableCredential(encoded)

    expect(wrapped).toEqual({
      type: OriginalType.MSO_MDOC_ENCODED,
      format: 'mso_mdoc',
      original: encoded,
      credential: expect.any(Object),
      decoded: {
        university: {
          degree: 'bachelor',
          name: 'John Doe',
          not: 'disclosed',
          location: 'innsbruck',
        },
      },
    })
  })

  it('decode funke pid mdoc', () => {
    const encoded =
      'omppc3N1ZXJBdXRohEOhASahGCGCWQJ4MIICdDCCAhugAwIBAgIBAjAKBggqhkjOPQQDAjCBiDELMAkGA1UEBhMCREUxDzANBgNVBAcMBkJlcmxpbjEdMBsGA1UECgwUQnVuZGVzZHJ1Y2tlcmVpIEdtYkgxETAPBgNVBAsMCFQgQ1MgSURFMTYwNAYDVQQDDC1TUFJJTkQgRnVua2UgRVVESSBXYWxsZXQgUHJvdG90eXBlIElzc3VpbmcgQ0EwHhcNMjQwNTMxMDgxMzE3WhcNMjUwNzA1MDgxMzE3WjBsMQswCQYDVQQGEwJERTEdMBsGA1UECgwUQnVuZGVzZHJ1Y2tlcmVpIEdtYkgxCjAIBgNVBAsMAUkxMjAwBgNVBAMMKVNQUklORCBGdW5rZSBFVURJIFdhbGxldCBQcm90b3R5cGUgSXNzdWVyMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEOFBq4YMKg4w5fTifsytwBuJf_7E7VhRPXiNm52S3q1ETIgBdXyDK3kVxGxgeHPivLP3uuMvS6iDEc7qMxmvduKOBkDCBjTAdBgNVHQ4EFgQUiPhCkLErDXPLW2_J0WVeghyw-mIwDAYDVR0TAQH_BAIwADAOBgNVHQ8BAf8EBAMCB4AwLQYDVR0RBCYwJIIiZGVtby5waWQtaXNzdWVyLmJ1bmRlc2RydWNrZXJlaS5kZTAfBgNVHSMEGDAWgBTUVhjAiTjoDliEGMl2Yr-ru8WQvjAKBggqhkjOPQQDAgNHADBEAiAbf5TzkcQzhfWoIoyi1VN7d8I9BsFKm1MWluRph2byGQIgKYkdrNf2xXPjVSbjW_U_5S5vAEC5XxcOanusOBroBbVZAn0wggJ5MIICIKADAgECAhQHkT1BVm2ZRhwO0KMoH8fdVC_vaDAKBggqhkjOPQQDAjCBiDELMAkGA1UEBhMCREUxDzANBgNVBAcMBkJlcmxpbjEdMBsGA1UECgwUQnVuZGVzZHJ1Y2tlcmVpIEdtYkgxETAPBgNVBAsMCFQgQ1MgSURFMTYwNAYDVQQDDC1TUFJJTkQgRnVua2UgRVVESSBXYWxsZXQgUHJvdG90eXBlIElzc3VpbmcgQ0EwHhcNMjQwNTMxMDY0ODA5WhcNMzQwNTI5MDY0ODA5WjCBiDELMAkGA1UEBhMCREUxDzANBgNVBAcMBkJlcmxpbjEdMBsGA1UECgwUQnVuZGVzZHJ1Y2tlcmVpIEdtYkgxETAPBgNVBAsMCFQgQ1MgSURFMTYwNAYDVQQDDC1TUFJJTkQgRnVua2UgRVVESSBXYWxsZXQgUHJvdG90eXBlIElzc3VpbmcgQ0EwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAARgbN3AUOdzv4qfmJsC8I4zyR7vtVDGp8xzBkvwhogD5YJE5wJ-Zj-CIf3aoyu7mn-TI6K8TREL8ht0w428OhTJo2YwZDAdBgNVHQ4EFgQU1FYYwIk46A5YhBjJdmK_q7vFkL4wHwYDVR0jBBgwFoAU1FYYwIk46A5YhBjJdmK_q7vFkL4wEgYDVR0TAQH_BAgwBgEB_wIBADAOBgNVHQ8BAf8EBAMCAYYwCgYIKoZIzj0EAwIDRwAwRAIgYSbvCRkoe39q1vgx0WddbrKufAxRPa7XfqB22XXRjqECIG5MWq9Vi2HWtvHMI_TFZkeZAr2RXLGfwY99fbsQjPOzWQRA2BhZBDumZ2RvY1R5cGV3ZXUuZXVyb3BhLmVjLmV1ZGkucGlkLjFndmVyc2lvbmMxLjBsdmFsaWRpdHlJbmZvo2ZzaWduZWR0MjAyNC0wNi0yNFQwNjo1MDo0MFppdmFsaWRGcm9tdDIwMjQtMDYtMjRUMDY6NTA6NDBaanZhbGlkVW50aWx0MjAyNC0wNy0wOFQwNjo1MDo0MFpsdmFsdWVEaWdlc3RzoXdldS5ldXJvcGEuZWMuZXVkaS5waWQuMbYAWCDJVfFwuYp2QoZROAvEN2pyUZ1KM8pEWRZXfdWrF1HkigFYIHhpl7kR5NAjeLSFJd0LsjMB9_ZeOBi-pYiOSwG78rrEAlggEih2FMRoq01sCrA8gZ-r_pUqi7add99aSg_l9iuV7w8DWCD9umaT-ULFoZSewraVNXFFWf3iNm5rgj75OQAy7n-1HQRYIL8xH7_OLXmsTruVMI1AInTjtDyPiDkk3ZaljsXFMaeYBVgg2-7WIwtpcZgVI3ZpKiFOqf8cV_R8G20adAqk3xLmaR8GWCCMFjcNb1Yp0rw86h1OOYCPzIhE-Dt5yWCQ7BTpNbZBuwdYIEzmGyjypgomuuwlwyp44zLi6sXT11ZNoyDAMKEsNP0pCFggI2ENhbCnOrZsVvqNE1GJe13ygY7MMU_Hv7l7j60Y5BgJWCBDZb6ztiG-09jmZNNc3Qi4e1OhyqtNmrOxzuzCtMYKcgpYIDGYllJw4PxQlyaeiI-a0qaeD9C3qh2hKXtvYYol928zC1gg4etokah75K55-qzJ6_FtE2KtAF9gy3gzcTeirdZ3LHwMWCDnCnqeX1M1iJe3LH2qc0kJOXQHYUEubpqVi2c4wtt3xQ1YIL7dVtgkdG9n2pDvrBtgY21i7X7YyiVCe-p61mtghwjnDlggQk4FkmKScm6oCwHtt5Og5E_1SQfuWpFIMdj0x8ZCS0wPWCBGMDXYqqBPDqeqBoFn3IKJSZWcdMj7KyU1ZtNOZ3OE6hBYIJyzjluOe_VlYSQw1aIBcrsnnF2czy5ypChycRfi0nrOEVggKOd_n9xKuZDdnak-vQ1zrIzSWLxJIlPgJMpLEn2FuLYSWCBHx1eoCb1ydVj_EGIKUOYPCyEjAgP5HxN-J_zSZUwkKBNYIN0hCZPdhjF4pU-LVEoQi7FdOSF3lrQ8EimA7C31NcVhFFggxtk6j0328cyjnwNoWKCUgvg1Uk37Bktpzb4atlRT5VIVWCAMujq43dRJg7XilJJL0z-hxQoLUpkzO2tq6H6LazG0uW1kZXZpY2VLZXlJbmZvoWlkZXZpY2VLZXmkAQIgASFYIMrI7GWNvKwCXqwcJmkBMyIRAXejiET9PRAFCMhJEfo9IlggEvXLy65sT8QyzLnWsC7aIM1eem2029awDcWI7WO0ES9vZGlnZXN0QWxnb3JpdGhtZ1NIQS0yNTZYQLVKBk4WMWUjTFWSwUuz7vCPNCAqw5x7HIBHVr1H_gC5WOEXxBaFlnxHYBjBguFSfLe5e-7t82ySdef7uvo6d2NqbmFtZVNwYWNlc6F3ZXUuZXVyb3BhLmVjLmV1ZGkucGlkLjGW2BhYVqRmcmFuZG9tUPYpQ7wOENpcyi6n1L56UdhoZGlnZXN0SUQAbGVsZW1lbnRWYWx1ZWJERXFlbGVtZW50SWRlbnRpZmllcnByZXNpZGVudF9jb3VudHJ52BhYT6RmcmFuZG9tUMRgxk_vnHlF0GwDT1_ULxJoZGlnZXN0SUQBbGVsZW1lbnRWYWx1ZfVxZWxlbWVudElkZW50aWZpZXJrYWdlX292ZXJfMTLYGFhbpGZyYW5kb21QKjeWt5G4r5-qtZytkvPCY2hkaWdlc3RJRAJsZWxlbWVudFZhbHVlZkdBQkxFUnFlbGVtZW50SWRlbnRpZmllcnFmYW1pbHlfbmFtZV9iaXJ0aNgYWFOkZnJhbmRvbVBDbqFvUf9mgbrDQOa3wxwcaGRpZ2VzdElEA2xlbGVtZW50VmFsdWVlRVJJS0FxZWxlbWVudElkZW50aWZpZXJqZ2l2ZW5fbmFtZdgYWFSkZnJhbmRvbVC0poiPe3Qx58JWmtP7Q_WGaGRpZ2VzdElEBGxlbGVtZW50VmFsdWUZB6xxZWxlbWVudElkZW50aWZpZXJuYWdlX2JpcnRoX3llYXLYGFhPpGZyYW5kb21Qu7cn53_6IG1TiAz9anV2VGhkaWdlc3RJRAVsZWxlbWVudFZhbHVl9XFlbGVtZW50SWRlbnRpZmllcmthZ2Vfb3Zlcl8xONgYWE-kZnJhbmRvbVCRPYwpMh16--3IgrBqvPiHaGRpZ2VzdElEBmxlbGVtZW50VmFsdWX1cWVsZW1lbnRJZGVudGlmaWVya2FnZV9vdmVyXzIx2BhYVqRmcmFuZG9tUGu5N18O3ztKBJRIqXuXprFoZGlnZXN0SUQHbGVsZW1lbnRWYWx1ZWVLw5ZMTnFlbGVtZW50SWRlbnRpZmllcm1yZXNpZGVudF9jaXR52BhYbKRmcmFuZG9tUDKXb5L9OGRMoOqY4ixLrj5oZGlnZXN0SUQIbGVsZW1lbnRWYWx1ZaJldmFsdWViREVrY291bnRyeU5hbWVnR2VybWFueXFlbGVtZW50SWRlbnRpZmllcmtuYXRpb25hbGl0edgYWFmkZnJhbmRvbVD4nB3KeJEBfi7oTQaUgKmcaGRpZ2VzdElECWxlbGVtZW50VmFsdWVqTVVTVEVSTUFOTnFlbGVtZW50SWRlbnRpZmllcmtmYW1pbHlfbmFtZdgYWFWkZnJhbmRvbVDzJdpDC6MZvIaVDJ_psS7JaGRpZ2VzdElECmxlbGVtZW50VmFsdWVmQkVSTElOcWVsZW1lbnRJZGVudGlmaWVya2JpcnRoX3BsYWNl2BhYVaRmcmFuZG9tUKEIada4bfyv5GeAbFb3reZoZGlnZXN0SUQLbGVsZW1lbnRWYWx1ZWJERXFlbGVtZW50SWRlbnRpZmllcm9pc3N1aW5nX2NvdW50cnnYGFhPpGZyYW5kb21Qqbo3TPNv6ilm7tvlR4l_GGhkaWdlc3RJRAxsZWxlbWVudFZhbHVl9HFlbGVtZW50SWRlbnRpZmllcmthZ2Vfb3Zlcl82NdgYWGykZnJhbmRvbVC_nvMTClyTddZfwm_WviXAaGRpZ2VzdElEDWxlbGVtZW50VmFsdWWiZG5hbm8aNQgmzGtlcG9jaFNlY29uZBpmeRdAcWVsZW1lbnRJZGVudGlmaWVybWlzc3VhbmNlX2RhdGXYGFhqpGZyYW5kb21QPqCKymVJhGPADlN7tILk2mhkaWdlc3RJRA5sZWxlbWVudFZhbHVlomRuYW5vGjUIJsxrZXBvY2hTZWNvbmQaZouMQHFlbGVtZW50SWRlbnRpZmllcmtleHBpcnlfZGF0ZdgYWGOkZnJhbmRvbVC0Cd-E5IjcJYTHKNzujqXlaGRpZ2VzdElED2xlbGVtZW50VmFsdWVwSEVJREVTVFJB4bqeRSAxN3FlbGVtZW50SWRlbnRpZmllcm9yZXNpZGVudF9zdHJlZXTYGFhPpGZyYW5kb21QBSfulxP_wSm8WUJ31jD9U2hkaWdlc3RJRBBsZWxlbWVudFZhbHVl9XFlbGVtZW50SWRlbnRpZmllcmthZ2Vfb3Zlcl8xNtgYWF2kZnJhbmRvbVDAyvF8NuW7ZU4yWPFlZEQ9aGRpZ2VzdElEEWxlbGVtZW50VmFsdWVlNTExNDdxZWxlbWVudElkZW50aWZpZXJ0cmVzaWRlbnRfcG9zdGFsX2NvZGXYGFhYpGZyYW5kb21QH_0ki1hqwWblAMFbrwMO2GhkaWdlc3RJRBJsZWxlbWVudFZhbHVlajE5NjQtMDgtMTJxZWxlbWVudElkZW50aWZpZXJqYmlydGhfZGF0ZdgYWFekZnJhbmRvbVBaUAbNICOqTrrbEaDKqbtSaGRpZ2VzdElEE2xlbGVtZW50VmFsdWViREVxZWxlbWVudElkZW50aWZpZXJxaXNzdWluZ19hdXRob3JpdHnYGFhPpGZyYW5kb21QtyDyyKiExuZFhmsIS1M122hkaWdlc3RJRBRsZWxlbWVudFZhbHVl9XFlbGVtZW50SWRlbnRpZmllcmthZ2Vfb3Zlcl8xNNgYWFGkZnJhbmRvbVAIbRM0JOd2WfpsMlmrMWMaaGRpZ2VzdElEFWxlbGVtZW50VmFsdWUYO3FlbGVtZW50SWRlbnRpZmllcmxhZ2VfaW5feWVhcnM'
    const wrapped = CredentialMapper.toWrappedVerifiableCredential(encoded)

    expect(wrapped).toEqual({
      type: OriginalType.MSO_MDOC_ENCODED,
      format: 'mso_mdoc',
      original: encoded,
      credential: expect.any(Object),
      decoded: {
        'eu.europa.ec.eudi.pid.1': {
          age_birth_year: 1964,
          age_in_years: 59,
          age_over_12: true,
          age_over_14: true,
          age_over_16: true,
          age_over_18: true,
          age_over_21: true,
          age_over_65: false,
          birth_date: '1964-08-12',
          birth_place: 'BERLIN',
          expiry_date: undefined,
          family_name: 'MUSTERMANN',
          family_name_birth: 'GABLER',
          given_name: 'ERIKA',
          issuance_date: undefined,
          issuing_authority: 'DE',
          issuing_country: 'DE',
          nationality: undefined,
          resident_city: 'KÖLN',
          resident_country: 'DE',
          resident_postal_code: '51147',
          resident_street: 'HEIDESTRAẞE 17',
        },
      },
    })
  })

  it('returns not equal when comparing two different mdocs', () => {
    const mdoc1 = decodeMdocIssuerSigned(
      'omppc3N1ZXJBdXRohEOhASahGCGCWQJ4MIICdDCCAhugAwIBAgIBAjAKBggqhkjOPQQDAjCBiDELMAkGA1UEBhMCREUxDzANBgNVBAcMBkJlcmxpbjEdMBsGA1UECgwUQnVuZGVzZHJ1Y2tlcmVpIEdtYkgxETAPBgNVBAsMCFQgQ1MgSURFMTYwNAYDVQQDDC1TUFJJTkQgRnVua2UgRVVESSBXYWxsZXQgUHJvdG90eXBlIElzc3VpbmcgQ0EwHhcNMjQwNTMxMDgxMzE3WhcNMjUwNzA1MDgxMzE3WjBsMQswCQYDVQQGEwJERTEdMBsGA1UECgwUQnVuZGVzZHJ1Y2tlcmVpIEdtYkgxCjAIBgNVBAsMAUkxMjAwBgNVBAMMKVNQUklORCBGdW5rZSBFVURJIFdhbGxldCBQcm90b3R5cGUgSXNzdWVyMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEOFBq4YMKg4w5fTifsytwBuJf_7E7VhRPXiNm52S3q1ETIgBdXyDK3kVxGxgeHPivLP3uuMvS6iDEc7qMxmvduKOBkDCBjTAdBgNVHQ4EFgQUiPhCkLErDXPLW2_J0WVeghyw-mIwDAYDVR0TAQH_BAIwADAOBgNVHQ8BAf8EBAMCB4AwLQYDVR0RBCYwJIIiZGVtby5waWQtaXNzdWVyLmJ1bmRlc2RydWNrZXJlaS5kZTAfBgNVHSMEGDAWgBTUVhjAiTjoDliEGMl2Yr-ru8WQvjAKBggqhkjOPQQDAgNHADBEAiAbf5TzkcQzhfWoIoyi1VN7d8I9BsFKm1MWluRph2byGQIgKYkdrNf2xXPjVSbjW_U_5S5vAEC5XxcOanusOBroBbVZAn0wggJ5MIICIKADAgECAhQHkT1BVm2ZRhwO0KMoH8fdVC_vaDAKBggqhkjOPQQDAjCBiDELMAkGA1UEBhMCREUxDzANBgNVBAcMBkJlcmxpbjEdMBsGA1UECgwUQnVuZGVzZHJ1Y2tlcmVpIEdtYkgxETAPBgNVBAsMCFQgQ1MgSURFMTYwNAYDVQQDDC1TUFJJTkQgRnVua2UgRVVESSBXYWxsZXQgUHJvdG90eXBlIElzc3VpbmcgQ0EwHhcNMjQwNTMxMDY0ODA5WhcNMzQwNTI5MDY0ODA5WjCBiDELMAkGA1UEBhMCREUxDzANBgNVBAcMBkJlcmxpbjEdMBsGA1UECgwUQnVuZGVzZHJ1Y2tlcmVpIEdtYkgxETAPBgNVBAsMCFQgQ1MgSURFMTYwNAYDVQQDDC1TUFJJTkQgRnVua2UgRVVESSBXYWxsZXQgUHJvdG90eXBlIElzc3VpbmcgQ0EwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAARgbN3AUOdzv4qfmJsC8I4zyR7vtVDGp8xzBkvwhogD5YJE5wJ-Zj-CIf3aoyu7mn-TI6K8TREL8ht0w428OhTJo2YwZDAdBgNVHQ4EFgQU1FYYwIk46A5YhBjJdmK_q7vFkL4wHwYDVR0jBBgwFoAU1FYYwIk46A5YhBjJdmK_q7vFkL4wEgYDVR0TAQH_BAgwBgEB_wIBADAOBgNVHQ8BAf8EBAMCAYYwCgYIKoZIzj0EAwIDRwAwRAIgYSbvCRkoe39q1vgx0WddbrKufAxRPa7XfqB22XXRjqECIG5MWq9Vi2HWtvHMI_TFZkeZAr2RXLGfwY99fbsQjPOzWQRA2BhZBDumZ2RvY1R5cGV3ZXUuZXVyb3BhLmVjLmV1ZGkucGlkLjFndmVyc2lvbmMxLjBsdmFsaWRpdHlJbmZvo2ZzaWduZWR0MjAyNC0wNi0yNFQwNjo1MDo0MFppdmFsaWRGcm9tdDIwMjQtMDYtMjRUMDY6NTA6NDBaanZhbGlkVW50aWx0MjAyNC0wNy0wOFQwNjo1MDo0MFpsdmFsdWVEaWdlc3RzoXdldS5ldXJvcGEuZWMuZXVkaS5waWQuMbYAWCDJVfFwuYp2QoZROAvEN2pyUZ1KM8pEWRZXfdWrF1HkigFYIHhpl7kR5NAjeLSFJd0LsjMB9_ZeOBi-pYiOSwG78rrEAlggEih2FMRoq01sCrA8gZ-r_pUqi7add99aSg_l9iuV7w8DWCD9umaT-ULFoZSewraVNXFFWf3iNm5rgj75OQAy7n-1HQRYIL8xH7_OLXmsTruVMI1AInTjtDyPiDkk3ZaljsXFMaeYBVgg2-7WIwtpcZgVI3ZpKiFOqf8cV_R8G20adAqk3xLmaR8GWCCMFjcNb1Yp0rw86h1OOYCPzIhE-Dt5yWCQ7BTpNbZBuwdYIEzmGyjypgomuuwlwyp44zLi6sXT11ZNoyDAMKEsNP0pCFggI2ENhbCnOrZsVvqNE1GJe13ygY7MMU_Hv7l7j60Y5BgJWCBDZb6ztiG-09jmZNNc3Qi4e1OhyqtNmrOxzuzCtMYKcgpYIDGYllJw4PxQlyaeiI-a0qaeD9C3qh2hKXtvYYol928zC1gg4etokah75K55-qzJ6_FtE2KtAF9gy3gzcTeirdZ3LHwMWCDnCnqeX1M1iJe3LH2qc0kJOXQHYUEubpqVi2c4wtt3xQ1YIL7dVtgkdG9n2pDvrBtgY21i7X7YyiVCe-p61mtghwjnDlggQk4FkmKScm6oCwHtt5Og5E_1SQfuWpFIMdj0x8ZCS0wPWCBGMDXYqqBPDqeqBoFn3IKJSZWcdMj7KyU1ZtNOZ3OE6hBYIJyzjluOe_VlYSQw1aIBcrsnnF2czy5ypChycRfi0nrOEVggKOd_n9xKuZDdnak-vQ1zrIzSWLxJIlPgJMpLEn2FuLYSWCBHx1eoCb1ydVj_EGIKUOYPCyEjAgP5HxN-J_zSZUwkKBNYIN0hCZPdhjF4pU-LVEoQi7FdOSF3lrQ8EimA7C31NcVhFFggxtk6j0328cyjnwNoWKCUgvg1Uk37Bktpzb4atlRT5VIVWCAMujq43dRJg7XilJJL0z-hxQoLUpkzO2tq6H6LazG0uW1kZXZpY2VLZXlJbmZvoWlkZXZpY2VLZXmkAQIgASFYIMrI7GWNvKwCXqwcJmkBMyIRAXejiET9PRAFCMhJEfo9IlggEvXLy65sT8QyzLnWsC7aIM1eem2029awDcWI7WO0ES9vZGlnZXN0QWxnb3JpdGhtZ1NIQS0yNTZYQLVKBk4WMWUjTFWSwUuz7vCPNCAqw5x7HIBHVr1H_gC5WOEXxBaFlnxHYBjBguFSfLe5e-7t82ySdef7uvo6d2NqbmFtZVNwYWNlc6F3ZXUuZXVyb3BhLmVjLmV1ZGkucGlkLjGW2BhYVqRmcmFuZG9tUPYpQ7wOENpcyi6n1L56UdhoZGlnZXN0SUQAbGVsZW1lbnRWYWx1ZWJERXFlbGVtZW50SWRlbnRpZmllcnByZXNpZGVudF9jb3VudHJ52BhYT6RmcmFuZG9tUMRgxk_vnHlF0GwDT1_ULxJoZGlnZXN0SUQBbGVsZW1lbnRWYWx1ZfVxZWxlbWVudElkZW50aWZpZXJrYWdlX292ZXJfMTLYGFhbpGZyYW5kb21QKjeWt5G4r5-qtZytkvPCY2hkaWdlc3RJRAJsZWxlbWVudFZhbHVlZkdBQkxFUnFlbGVtZW50SWRlbnRpZmllcnFmYW1pbHlfbmFtZV9iaXJ0aNgYWFOkZnJhbmRvbVBDbqFvUf9mgbrDQOa3wxwcaGRpZ2VzdElEA2xlbGVtZW50VmFsdWVlRVJJS0FxZWxlbWVudElkZW50aWZpZXJqZ2l2ZW5fbmFtZdgYWFSkZnJhbmRvbVC0poiPe3Qx58JWmtP7Q_WGaGRpZ2VzdElEBGxlbGVtZW50VmFsdWUZB6xxZWxlbWVudElkZW50aWZpZXJuYWdlX2JpcnRoX3llYXLYGFhPpGZyYW5kb21Qu7cn53_6IG1TiAz9anV2VGhkaWdlc3RJRAVsZWxlbWVudFZhbHVl9XFlbGVtZW50SWRlbnRpZmllcmthZ2Vfb3Zlcl8xONgYWE-kZnJhbmRvbVCRPYwpMh16--3IgrBqvPiHaGRpZ2VzdElEBmxlbGVtZW50VmFsdWX1cWVsZW1lbnRJZGVudGlmaWVya2FnZV9vdmVyXzIx2BhYVqRmcmFuZG9tUGu5N18O3ztKBJRIqXuXprFoZGlnZXN0SUQHbGVsZW1lbnRWYWx1ZWVLw5ZMTnFlbGVtZW50SWRlbnRpZmllcm1yZXNpZGVudF9jaXR52BhYbKRmcmFuZG9tUDKXb5L9OGRMoOqY4ixLrj5oZGlnZXN0SUQIbGVsZW1lbnRWYWx1ZaJldmFsdWViREVrY291bnRyeU5hbWVnR2VybWFueXFlbGVtZW50SWRlbnRpZmllcmtuYXRpb25hbGl0edgYWFmkZnJhbmRvbVD4nB3KeJEBfi7oTQaUgKmcaGRpZ2VzdElECWxlbGVtZW50VmFsdWVqTVVTVEVSTUFOTnFlbGVtZW50SWRlbnRpZmllcmtmYW1pbHlfbmFtZdgYWFWkZnJhbmRvbVDzJdpDC6MZvIaVDJ_psS7JaGRpZ2VzdElECmxlbGVtZW50VmFsdWVmQkVSTElOcWVsZW1lbnRJZGVudGlmaWVya2JpcnRoX3BsYWNl2BhYVaRmcmFuZG9tUKEIada4bfyv5GeAbFb3reZoZGlnZXN0SUQLbGVsZW1lbnRWYWx1ZWJERXFlbGVtZW50SWRlbnRpZmllcm9pc3N1aW5nX2NvdW50cnnYGFhPpGZyYW5kb21Qqbo3TPNv6ilm7tvlR4l_GGhkaWdlc3RJRAxsZWxlbWVudFZhbHVl9HFlbGVtZW50SWRlbnRpZmllcmthZ2Vfb3Zlcl82NdgYWGykZnJhbmRvbVC_nvMTClyTddZfwm_WviXAaGRpZ2VzdElEDWxlbGVtZW50VmFsdWWiZG5hbm8aNQgmzGtlcG9jaFNlY29uZBpmeRdAcWVsZW1lbnRJZGVudGlmaWVybWlzc3VhbmNlX2RhdGXYGFhqpGZyYW5kb21QPqCKymVJhGPADlN7tILk2mhkaWdlc3RJRA5sZWxlbWVudFZhbHVlomRuYW5vGjUIJsxrZXBvY2hTZWNvbmQaZouMQHFlbGVtZW50SWRlbnRpZmllcmtleHBpcnlfZGF0ZdgYWGOkZnJhbmRvbVC0Cd-E5IjcJYTHKNzujqXlaGRpZ2VzdElED2xlbGVtZW50VmFsdWVwSEVJREVTVFJB4bqeRSAxN3FlbGVtZW50SWRlbnRpZmllcm9yZXNpZGVudF9zdHJlZXTYGFhPpGZyYW5kb21QBSfulxP_wSm8WUJ31jD9U2hkaWdlc3RJRBBsZWxlbWVudFZhbHVl9XFlbGVtZW50SWRlbnRpZmllcmthZ2Vfb3Zlcl8xNtgYWF2kZnJhbmRvbVDAyvF8NuW7ZU4yWPFlZEQ9aGRpZ2VzdElEEWxlbGVtZW50VmFsdWVlNTExNDdxZWxlbWVudElkZW50aWZpZXJ0cmVzaWRlbnRfcG9zdGFsX2NvZGXYGFhYpGZyYW5kb21QH_0ki1hqwWblAMFbrwMO2GhkaWdlc3RJRBJsZWxlbWVudFZhbHVlajE5NjQtMDgtMTJxZWxlbWVudElkZW50aWZpZXJqYmlydGhfZGF0ZdgYWFekZnJhbmRvbVBaUAbNICOqTrrbEaDKqbtSaGRpZ2VzdElEE2xlbGVtZW50VmFsdWViREVxZWxlbWVudElkZW50aWZpZXJxaXNzdWluZ19hdXRob3JpdHnYGFhPpGZyYW5kb21QtyDyyKiExuZFhmsIS1M122hkaWdlc3RJRBRsZWxlbWVudFZhbHVl9XFlbGVtZW50SWRlbnRpZmllcmthZ2Vfb3Zlcl8xNNgYWFGkZnJhbmRvbVAIbRM0JOd2WfpsMlmrMWMaaGRpZ2VzdElEFWxlbGVtZW50VmFsdWUYO3FlbGVtZW50SWRlbnRpZmllcmxhZ2VfaW5feWVhcnM'
    )
    const mdoc2 = decodeMdocIssuerSigned(
      'uQACam5hbWVTcGFjZXOhanVuaXZlcnNpdHmE2BhYZqRoZGlnZXN0SUQAcWVsZW1lbnRJZGVudGlmaWVyaGxvY2F0aW9ubGVsZW1lbnRWYWx1ZWlpbm5zYnJ1Y2tmcmFuZG9tWCAw6CXtd4ubXAr6uLB1GnfRyHVqhjH1_73iDASmcZefQtgYWGOkaGRpZ2VzdElEAXFlbGVtZW50SWRlbnRpZmllcmZkZWdyZWVsZWxlbWVudFZhbHVlaGJhY2hlbG9yZnJhbmRvbVgglzuY8jgQd7y_wuH47AYfzlEfzz827RRjo4k845nK5DLYGFhhpGhkaWdlc3RJRAJxZWxlbWVudElkZW50aWZpZXJkbmFtZWxlbGVtZW50VmFsdWVoSm9obiBEb2VmcmFuZG9tWCDtU0gwjxNPz1q2AjgYWkAGWSHDq7BsXzns_aMMNeVkE9gYWGGkaGRpZ2VzdElEA3FlbGVtZW50SWRlbnRpZmllcmNub3RsZWxlbWVudFZhbHVlaWRpc2Nsb3NlZGZyYW5kb21YICSQ7u_6OBRr8V3c5hmIeL-NKBPEaUGWPxkv8TwTPdTbamlzc3VlckF1dGiEQ6EBJqIEWDF6RG5hZWRydmd5bXpvZnhvYTRWb1VDOFJRemdwMVJnZnBCTkw1SFZuV1NKb1oyeXJhGCGBWPwwgfkwgaCgAwIBAgIQTWQTeD9zo_1knyJtFXU2hzAKBggqhkjOPQQDAjANMQswCQYDVQQGEwJERTAeFw0yNDEwMzAxNDA5MDRaFw0yNTEwMzAxNDA5MDRaMA0xCzAJBgNVBAYTAkRFMDkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDIgACx4zJR4xIci9iFJPsMUX-mu4Khh63a_hjQKef7NyM2cOjAjAAMAoGCCqGSM49BAMCA0gAMEUCIQCRXFKtPshVsgBYMjH1-VA2sU2bphzWRLYrYvALfGTBdQIgLHF1n5J7KAiDhPTjmx3xxBlCVMYan_SKqXKxZVuO1M1ZAdDYGFkBy7kABmd2ZXJzaW9uYzEuMG9kaWdlc3RBbGdvcml0aG1nU0hBLTI1Nmx2YWx1ZURpZ2VzdHOhanVuaXZlcnNpdHmkAFggkN_ol8cnR2iCh3YLAYSt_-gt_hUT9ZIlm1LCS2kHW3gBWCAz2zbutIrJdbeAGi1T64jyst4PtE9WwjJK2-py9dyafQJYIHoRBZqOeV9IhNcbYsK46RaA95WyT7mq6-yqoh6j6Ds-A1ggwzOqmOGhsmiCMaEugAowlgUkzNxl0tD4CgbIx5u1Xx9tZGV2aWNlS2V5SW5mb7kAAWlkZXZpY2VLZXmkAQIgASFYIHhQ3snZrFRdtxGAB4HPsgmtZXHpzztrXjQXPRurqHtwIlggG9V2VQ1XAa9BRwxpgguzfhtP0gz8M52TWYDLwbe0P4ZnZG9jVHlwZXFvcmcuZXUudW5pdmVyc2l0eWx2YWxpZGl0eUluZm-5AARmc2lnbmVkwHQyMDI0LTEwLTMwVDE0OjA5OjA0Wml2YWxpZEZyb23AdDIwMjQtMTAtMzBUMTQ6MDk6MDRaanZhbGlkVW50aWzAdDIwMjUtMTAtMzBUMTQ6MDk6MDRabmV4cGVjdGVkVXBkYXRl91hAjkeOGOUm0CToTYOf0x3mtHFIzwT_LTHUYvcWaWrksmBOuUgZekkHAo9Bl9UTI0NKhEBIbKv9mGWHwJUgQ_1AIw'
    )
    expect(CredentialMapper.areOriginalVerifiableCredentialsEqual(mdoc1, mdoc2)).toBe(false)
  })

  it('compares mdoc with only issuer signed', () => {
    const encoded =
      'omppc3N1ZXJBdXRohEOhASahGCGCWQJ4MIICdDCCAhugAwIBAgIBAjAKBggqhkjOPQQDAjCBiDELMAkGA1UEBhMCREUxDzANBgNVBAcMBkJlcmxpbjEdMBsGA1UECgwUQnVuZGVzZHJ1Y2tlcmVpIEdtYkgxETAPBgNVBAsMCFQgQ1MgSURFMTYwNAYDVQQDDC1TUFJJTkQgRnVua2UgRVVESSBXYWxsZXQgUHJvdG90eXBlIElzc3VpbmcgQ0EwHhcNMjQwNTMxMDgxMzE3WhcNMjUwNzA1MDgxMzE3WjBsMQswCQYDVQQGEwJERTEdMBsGA1UECgwUQnVuZGVzZHJ1Y2tlcmVpIEdtYkgxCjAIBgNVBAsMAUkxMjAwBgNVBAMMKVNQUklORCBGdW5rZSBFVURJIFdhbGxldCBQcm90b3R5cGUgSXNzdWVyMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEOFBq4YMKg4w5fTifsytwBuJf_7E7VhRPXiNm52S3q1ETIgBdXyDK3kVxGxgeHPivLP3uuMvS6iDEc7qMxmvduKOBkDCBjTAdBgNVHQ4EFgQUiPhCkLErDXPLW2_J0WVeghyw-mIwDAYDVR0TAQH_BAIwADAOBgNVHQ8BAf8EBAMCB4AwLQYDVR0RBCYwJIIiZGVtby5waWQtaXNzdWVyLmJ1bmRlc2RydWNrZXJlaS5kZTAfBgNVHSMEGDAWgBTUVhjAiTjoDliEGMl2Yr-ru8WQvjAKBggqhkjOPQQDAgNHADBEAiAbf5TzkcQzhfWoIoyi1VN7d8I9BsFKm1MWluRph2byGQIgKYkdrNf2xXPjVSbjW_U_5S5vAEC5XxcOanusOBroBbVZAn0wggJ5MIICIKADAgECAhQHkT1BVm2ZRhwO0KMoH8fdVC_vaDAKBggqhkjOPQQDAjCBiDELMAkGA1UEBhMCREUxDzANBgNVBAcMBkJlcmxpbjEdMBsGA1UECgwUQnVuZGVzZHJ1Y2tlcmVpIEdtYkgxETAPBgNVBAsMCFQgQ1MgSURFMTYwNAYDVQQDDC1TUFJJTkQgRnVua2UgRVVESSBXYWxsZXQgUHJvdG90eXBlIElzc3VpbmcgQ0EwHhcNMjQwNTMxMDY0ODA5WhcNMzQwNTI5MDY0ODA5WjCBiDELMAkGA1UEBhMCREUxDzANBgNVBAcMBkJlcmxpbjEdMBsGA1UECgwUQnVuZGVzZHJ1Y2tlcmVpIEdtYkgxETAPBgNVBAsMCFQgQ1MgSURFMTYwNAYDVQQDDC1TUFJJTkQgRnVua2UgRVVESSBXYWxsZXQgUHJvdG90eXBlIElzc3VpbmcgQ0EwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAARgbN3AUOdzv4qfmJsC8I4zyR7vtVDGp8xzBkvwhogD5YJE5wJ-Zj-CIf3aoyu7mn-TI6K8TREL8ht0w428OhTJo2YwZDAdBgNVHQ4EFgQU1FYYwIk46A5YhBjJdmK_q7vFkL4wHwYDVR0jBBgwFoAU1FYYwIk46A5YhBjJdmK_q7vFkL4wEgYDVR0TAQH_BAgwBgEB_wIBADAOBgNVHQ8BAf8EBAMCAYYwCgYIKoZIzj0EAwIDRwAwRAIgYSbvCRkoe39q1vgx0WddbrKufAxRPa7XfqB22XXRjqECIG5MWq9Vi2HWtvHMI_TFZkeZAr2RXLGfwY99fbsQjPOzWQRA2BhZBDumZ2RvY1R5cGV3ZXUuZXVyb3BhLmVjLmV1ZGkucGlkLjFndmVyc2lvbmMxLjBsdmFsaWRpdHlJbmZvo2ZzaWduZWR0MjAyNC0wNi0yNFQwNjo1MDo0MFppdmFsaWRGcm9tdDIwMjQtMDYtMjRUMDY6NTA6NDBaanZhbGlkVW50aWx0MjAyNC0wNy0wOFQwNjo1MDo0MFpsdmFsdWVEaWdlc3RzoXdldS5ldXJvcGEuZWMuZXVkaS5waWQuMbYAWCDJVfFwuYp2QoZROAvEN2pyUZ1KM8pEWRZXfdWrF1HkigFYIHhpl7kR5NAjeLSFJd0LsjMB9_ZeOBi-pYiOSwG78rrEAlggEih2FMRoq01sCrA8gZ-r_pUqi7add99aSg_l9iuV7w8DWCD9umaT-ULFoZSewraVNXFFWf3iNm5rgj75OQAy7n-1HQRYIL8xH7_OLXmsTruVMI1AInTjtDyPiDkk3ZaljsXFMaeYBVgg2-7WIwtpcZgVI3ZpKiFOqf8cV_R8G20adAqk3xLmaR8GWCCMFjcNb1Yp0rw86h1OOYCPzIhE-Dt5yWCQ7BTpNbZBuwdYIEzmGyjypgomuuwlwyp44zLi6sXT11ZNoyDAMKEsNP0pCFggI2ENhbCnOrZsVvqNE1GJe13ygY7MMU_Hv7l7j60Y5BgJWCBDZb6ztiG-09jmZNNc3Qi4e1OhyqtNmrOxzuzCtMYKcgpYIDGYllJw4PxQlyaeiI-a0qaeD9C3qh2hKXtvYYol928zC1gg4etokah75K55-qzJ6_FtE2KtAF9gy3gzcTeirdZ3LHwMWCDnCnqeX1M1iJe3LH2qc0kJOXQHYUEubpqVi2c4wtt3xQ1YIL7dVtgkdG9n2pDvrBtgY21i7X7YyiVCe-p61mtghwjnDlggQk4FkmKScm6oCwHtt5Og5E_1SQfuWpFIMdj0x8ZCS0wPWCBGMDXYqqBPDqeqBoFn3IKJSZWcdMj7KyU1ZtNOZ3OE6hBYIJyzjluOe_VlYSQw1aIBcrsnnF2czy5ypChycRfi0nrOEVggKOd_n9xKuZDdnak-vQ1zrIzSWLxJIlPgJMpLEn2FuLYSWCBHx1eoCb1ydVj_EGIKUOYPCyEjAgP5HxN-J_zSZUwkKBNYIN0hCZPdhjF4pU-LVEoQi7FdOSF3lrQ8EimA7C31NcVhFFggxtk6j0328cyjnwNoWKCUgvg1Uk37Bktpzb4atlRT5VIVWCAMujq43dRJg7XilJJL0z-hxQoLUpkzO2tq6H6LazG0uW1kZXZpY2VLZXlJbmZvoWlkZXZpY2VLZXmkAQIgASFYIMrI7GWNvKwCXqwcJmkBMyIRAXejiET9PRAFCMhJEfo9IlggEvXLy65sT8QyzLnWsC7aIM1eem2029awDcWI7WO0ES9vZGlnZXN0QWxnb3JpdGhtZ1NIQS0yNTZYQLVKBk4WMWUjTFWSwUuz7vCPNCAqw5x7HIBHVr1H_gC5WOEXxBaFlnxHYBjBguFSfLe5e-7t82ySdef7uvo6d2NqbmFtZVNwYWNlc6F3ZXUuZXVyb3BhLmVjLmV1ZGkucGlkLjGW2BhYVqRmcmFuZG9tUPYpQ7wOENpcyi6n1L56UdhoZGlnZXN0SUQAbGVsZW1lbnRWYWx1ZWJERXFlbGVtZW50SWRlbnRpZmllcnByZXNpZGVudF9jb3VudHJ52BhYT6RmcmFuZG9tUMRgxk_vnHlF0GwDT1_ULxJoZGlnZXN0SUQBbGVsZW1lbnRWYWx1ZfVxZWxlbWVudElkZW50aWZpZXJrYWdlX292ZXJfMTLYGFhbpGZyYW5kb21QKjeWt5G4r5-qtZytkvPCY2hkaWdlc3RJRAJsZWxlbWVudFZhbHVlZkdBQkxFUnFlbGVtZW50SWRlbnRpZmllcnFmYW1pbHlfbmFtZV9iaXJ0aNgYWFOkZnJhbmRvbVBDbqFvUf9mgbrDQOa3wxwcaGRpZ2VzdElEA2xlbGVtZW50VmFsdWVlRVJJS0FxZWxlbWVudElkZW50aWZpZXJqZ2l2ZW5fbmFtZdgYWFSkZnJhbmRvbVC0poiPe3Qx58JWmtP7Q_WGaGRpZ2VzdElEBGxlbGVtZW50VmFsdWUZB6xxZWxlbWVudElkZW50aWZpZXJuYWdlX2JpcnRoX3llYXLYGFhPpGZyYW5kb21Qu7cn53_6IG1TiAz9anV2VGhkaWdlc3RJRAVsZWxlbWVudFZhbHVl9XFlbGVtZW50SWRlbnRpZmllcmthZ2Vfb3Zlcl8xONgYWE-kZnJhbmRvbVCRPYwpMh16--3IgrBqvPiHaGRpZ2VzdElEBmxlbGVtZW50VmFsdWX1cWVsZW1lbnRJZGVudGlmaWVya2FnZV9vdmVyXzIx2BhYVqRmcmFuZG9tUGu5N18O3ztKBJRIqXuXprFoZGlnZXN0SUQHbGVsZW1lbnRWYWx1ZWVLw5ZMTnFlbGVtZW50SWRlbnRpZmllcm1yZXNpZGVudF9jaXR52BhYbKRmcmFuZG9tUDKXb5L9OGRMoOqY4ixLrj5oZGlnZXN0SUQIbGVsZW1lbnRWYWx1ZaJldmFsdWViREVrY291bnRyeU5hbWVnR2VybWFueXFlbGVtZW50SWRlbnRpZmllcmtuYXRpb25hbGl0edgYWFmkZnJhbmRvbVD4nB3KeJEBfi7oTQaUgKmcaGRpZ2VzdElECWxlbGVtZW50VmFsdWVqTVVTVEVSTUFOTnFlbGVtZW50SWRlbnRpZmllcmtmYW1pbHlfbmFtZdgYWFWkZnJhbmRvbVDzJdpDC6MZvIaVDJ_psS7JaGRpZ2VzdElECmxlbGVtZW50VmFsdWVmQkVSTElOcWVsZW1lbnRJZGVudGlmaWVya2JpcnRoX3BsYWNl2BhYVaRmcmFuZG9tUKEIada4bfyv5GeAbFb3reZoZGlnZXN0SUQLbGVsZW1lbnRWYWx1ZWJERXFlbGVtZW50SWRlbnRpZmllcm9pc3N1aW5nX2NvdW50cnnYGFhPpGZyYW5kb21Qqbo3TPNv6ilm7tvlR4l_GGhkaWdlc3RJRAxsZWxlbWVudFZhbHVl9HFlbGVtZW50SWRlbnRpZmllcmthZ2Vfb3Zlcl82NdgYWGykZnJhbmRvbVC_nvMTClyTddZfwm_WviXAaGRpZ2VzdElEDWxlbGVtZW50VmFsdWWiZG5hbm8aNQgmzGtlcG9jaFNlY29uZBpmeRdAcWVsZW1lbnRJZGVudGlmaWVybWlzc3VhbmNlX2RhdGXYGFhqpGZyYW5kb21QPqCKymVJhGPADlN7tILk2mhkaWdlc3RJRA5sZWxlbWVudFZhbHVlomRuYW5vGjUIJsxrZXBvY2hTZWNvbmQaZouMQHFlbGVtZW50SWRlbnRpZmllcmtleHBpcnlfZGF0ZdgYWGOkZnJhbmRvbVC0Cd-E5IjcJYTHKNzujqXlaGRpZ2VzdElED2xlbGVtZW50VmFsdWVwSEVJREVTVFJB4bqeRSAxN3FlbGVtZW50SWRlbnRpZmllcm9yZXNpZGVudF9zdHJlZXTYGFhPpGZyYW5kb21QBSfulxP_wSm8WUJ31jD9U2hkaWdlc3RJRBBsZWxlbWVudFZhbHVl9XFlbGVtZW50SWRlbnRpZmllcmthZ2Vfb3Zlcl8xNtgYWF2kZnJhbmRvbVDAyvF8NuW7ZU4yWPFlZEQ9aGRpZ2VzdElEEWxlbGVtZW50VmFsdWVlNTExNDdxZWxlbWVudElkZW50aWZpZXJ0cmVzaWRlbnRfcG9zdGFsX2NvZGXYGFhYpGZyYW5kb21QH_0ki1hqwWblAMFbrwMO2GhkaWdlc3RJRBJsZWxlbWVudFZhbHVlajE5NjQtMDgtMTJxZWxlbWVudElkZW50aWZpZXJqYmlydGhfZGF0ZdgYWFekZnJhbmRvbVBaUAbNICOqTrrbEaDKqbtSaGRpZ2VzdElEE2xlbGVtZW50VmFsdWViREVxZWxlbWVudElkZW50aWZpZXJxaXNzdWluZ19hdXRob3JpdHnYGFhPpGZyYW5kb21QtyDyyKiExuZFhmsIS1M122hkaWdlc3RJRBRsZWxlbWVudFZhbHVl9XFlbGVtZW50SWRlbnRpZmllcmthZ2Vfb3Zlcl8xNNgYWFGkZnJhbmRvbVAIbRM0JOd2WfpsMlmrMWMaaGRpZ2VzdElEFWxlbGVtZW50VmFsdWUYO3FlbGVtZW50SWRlbnRpZmllcmxhZ2VfaW5feWVhcnM'
    const mdoc = decodeMdocIssuerSigned(encoded)
    expect(CredentialMapper.areOriginalVerifiableCredentialsEqual(mdoc, mdoc)).toBe(true)
  })

  it('compares mdoc with device signed', () => {
    // https://github.com/openwallet-foundation-labs/identity-credential/blob/8a7428265aeafb7e0a3b52fba63576937ca11890/identity-mdoc/src/commonTest/kotlin/com/android/identity/mdoc/TestVectors.kt#L30C5-L36C31
    const encoded =
      'a36776657273696f6e63312e3069646f63756d656e747381a367646f6354797065756f72672e69736f2e31383031332e352e312e6d444c6c6973737565725369676e6564a26a6e616d65537061636573a1716f72672e69736f2e31383031332e352e3186d8185863a4686469676573744944006672616e646f6d58208798645b20ea200e19ffabac92624bee6aec63aceedecfb1b80077d22bfc20e971656c656d656e744964656e7469666965726b66616d696c795f6e616d656c656c656d656e7456616c756563446f65d818586ca4686469676573744944036672616e646f6d5820b23f627e8999c706df0c0a4ed98ad74af988af619b4bb078b89058553f44615d71656c656d656e744964656e7469666965726a69737375655f646174656c656c656d656e7456616c7565d903ec6a323031392d31302d3230d818586da4686469676573744944046672616e646f6d5820c7ffa307e5de921e67ba5878094787e8807ac8e7b5b3932d2ce80f00f3e9abaf71656c656d656e744964656e7469666965726b6578706972795f646174656c656c656d656e7456616c7565d903ec6a323032342d31302d3230d818586da4686469676573744944076672616e646f6d582026052a42e5880557a806c1459af3fb7eb505d3781566329d0b604b845b5f9e6871656c656d656e744964656e7469666965726f646f63756d656e745f6e756d6265726c656c656d656e7456616c756569313233343536373839d818590471a4686469676573744944086672616e646f6d5820d094dad764a2eb9deb5210e9d899643efbd1d069cc311d3295516ca0b024412d71656c656d656e744964656e74696669657268706f7274726169746c656c656d656e7456616c7565590412ffd8ffe000104a46494600010101009000900000ffdb004300130d0e110e0c13110f11151413171d301f1d1a1a1d3a2a2c2330453d4947443d43414c566d5d4c51685241435f82606871757b7c7b4a5c869085778f6d787b76ffdb0043011415151d191d381f1f38764f434f7676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676ffc00011080018006403012200021101031101ffc4001b00000301000301000000000000000000000005060401020307ffc400321000010303030205020309000000000000010203040005110612211331141551617122410781a1163542527391b2c1f1ffc4001501010100000000000000000000000000000001ffc4001a110101010003010000000000000000000000014111213161ffda000c03010002110311003f00a5bbde22da2329c7d692bc7d0d03f52cfb0ff75e7a7ef3e7709723a1d0dae146ddfbb3c039ce07ad2bd47a7e32dbb8dd1d52d6ef4b284f64a480067dfb51f87ffb95ff00eb9ff14d215de66af089ce44b7dbde9cb6890a2838eddf18078f7add62d411ef4db9b10a65d6b95a147381ea0d495b933275fe6bba75c114104a8ba410413e983dff004f5af5d34b4b4cde632d0bf1fd1592bdd91c6411f3934c2fa6af6b54975d106dcf4a65ae56e856001ebc03c7ce29dd9eef1ef10fc447dc9da76ad2aee93537a1ba7e4f70dd8eff0057c6dffb5e1a19854a83758e54528750946ec6704850cd037bceb08b6d7d2cc76d3317fc7b5cc04fb6707269c5c6e0c5b60ae549242123b0e493f602a075559e359970d98db89525456b51c951c8afa13ea8e98e3c596836783d5c63f5a61a99fdb7290875db4be88ab384bbbbbfc7183fdeaa633e8951db7da396dc48524fb1a8bd611a5aa2a2432f30ab420a7a6d3240c718cf031fa9ef4c9ad550205aa02951df4a1d6c8421b015b769db8c9229837ea2be8b1b0d39d0eba9c51484efdb8c0efd8d258daf3c449699f2edbd4584e7af9c64e3f96b9beb28d4ac40931e6478c8e76a24a825449501d867d2b1dcdebae99b9c752ae4ecd6dde4a179c1c1e460938f9149ef655e515c03919a289cb3dca278fb7bf177f4faa829dd8ce3f2ac9a7ecde490971fafd7dce15eed9b71c018c64fa514514b24e8e4f8c5c9b75c1e82579dc1233dfec08238f6add62d391acc1c5256a79e706d52d431c7a0145140b9fd149eb3a60dc5e88cbbc2da092411e9dc71f39a7766b447b344e847dcac9dcb5abba8d145061d43a6fcf1e65cf15d0e90231d3dd9cfe62995c6dcc5ca12a2c904a15f71dd27d451453e09d1a21450961cbb3ea8a956433b781f1ce33dfed54f0e2b50a2b71d84ed6db18028a28175f74fc6bda105c529a791c25c4f3c7a11f71586268f4a66b726e33de9ea6f1b52b181c760724e47b514520a5a28a283ffd9d81858ffa4686469676573744944096672616e646f6d58204599f81beaa2b20bd0ffcc9aa03a6f985befab3f6beaffa41e6354cdb2ab2ce471656c656d656e744964656e7469666965727264726976696e675f70726976696c656765736c656c656d656e7456616c756582a37576656869636c655f63617465676f72795f636f646561416a69737375655f64617465d903ec6a323031382d30382d30396b6578706972795f64617465d903ec6a323032342d31302d3230a37576656869636c655f63617465676f72795f636f646561426a69737375655f64617465d903ec6a323031372d30322d32336b6578706972795f64617465d903ec6a323032342d31302d32306a697373756572417574688443a10126a118215901f3308201ef30820195a00302010202143c4416eed784f3b413e48f56f075abfa6d87eb84300a06082a8648ce3d04030230233114301206035504030c0b75746f7069612069616361310b3009060355040613025553301e170d3230313030313030303030305a170d3231313030313030303030305a30213112301006035504030c0975746f706961206473310b30090603550406130255533059301306072a8648ce3d020106082a8648ce3d03010703420004ace7ab7340e5d9648c5a72a9a6f56745c7aad436a03a43efea77b5fa7b88f0197d57d8983e1b37d3a539f4d588365e38cbbf5b94d68c547b5bc8731dcd2f146ba381a83081a5301e0603551d120417301581136578616d706c65406578616d706c652e636f6d301c0603551d1f041530133011a00fa00d820b6578616d706c652e636f6d301d0603551d0e0416041414e29017a6c35621ffc7a686b7b72db06cd12351301f0603551d2304183016801454fa2383a04c28e0d930792261c80c4881d2c00b300e0603551d0f0101ff04040302078030150603551d250101ff040b3009060728818c5d050102300a06082a8648ce3d040302034800304502210097717ab9016740c8d7bcdaa494a62c053bbdecce1383c1aca72ad08dbc04cbb202203bad859c13a63c6d1ad67d814d43e2425caf90d422422c04a8ee0304c0d3a68d5903a2d81859039da66776657273696f6e63312e306f646967657374416c676f726974686d675348412d3235366c76616c756544696765737473a2716f72672e69736f2e31383031332e352e31ad00582075167333b47b6c2bfb86eccc1f438cf57af055371ac55e1e359e20f254adcebf01582067e539d6139ebd131aef441b445645dd831b2b375b390ca5ef6279b205ed45710258203394372ddb78053f36d5d869780e61eda313d44a392092ad8e0527a2fbfe55ae0358202e35ad3c4e514bb67b1a9db51ce74e4cb9b7146e41ac52dac9ce86b8613db555045820ea5c3304bb7c4a8dcb51c4c13b65264f845541341342093cca786e058fac2d59055820fae487f68b7a0e87a749774e56e9e1dc3a8ec7b77e490d21f0e1d3475661aa1d0658207d83e507ae77db815de4d803b88555d0511d894c897439f5774056416a1c7533075820f0549a145f1cf75cbeeffa881d4857dd438d627cf32174b1731c4c38e12ca936085820b68c8afcb2aaf7c581411d2877def155be2eb121a42bc9ba5b7312377e068f660958200b3587d1dd0c2a07a35bfb120d99a0abfb5df56865bb7fa15cc8b56a66df6e0c0a5820c98a170cf36e11abb724e98a75a5343dfa2b6ed3df2ecfbb8ef2ee55dd41c8810b5820b57dd036782f7b14c6a30faaaae6ccd5054ce88bdfa51a016ba75eda1edea9480c5820651f8736b18480fe252a03224ea087b5d10ca5485146c67c74ac4ec3112d4c3a746f72672e69736f2e31383031332e352e312e5553a4005820d80b83d25173c484c5640610ff1a31c949c1d934bf4cf7f18d5223b15dd4f21c0158204d80e1e2e4fb246d97895427ce7000bb59bb24c8cd003ecf94bf35bbd2917e340258208b331f3b685bca372e85351a25c9484ab7afcdf0d2233105511f778d98c2f544035820c343af1bd1690715439161aba73702c474abf992b20c9fb55c36a336ebe01a876d6465766963654b6579496e666fa1696465766963654b6579a40102200121582096313d6c63e24e3372742bfdb1a33ba2c897dcd68ab8c753e4fbd48dca6b7f9a2258201fb3269edd418857de1b39a4e4a44b92fa484caa722c228288f01d0c03a2c3d667646f6354797065756f72672e69736f2e31383031332e352e312e6d444c6c76616c6964697479496e666fa3667369676e6564c074323032302d31302d30315431333a33303a30325a6976616c696446726f6dc074323032302d31302d30315431333a33303a30325a6a76616c6964556e74696cc074323032312d31302d30315431333a33303a30325a584059e64205df1e2f708dd6db0847aed79fc7c0201d80fa55badcaf2e1bcf5902e1e5a62e4832044b890ad85aa53f129134775d733754d7cb7a413766aeff13cb2e6c6465766963655369676e6564a26a6e616d65537061636573d81841a06a64657669636541757468a1696465766963654d61638443a10105a0f65820e99521a85ad7891b806a07f8b5388a332d92c189a7bf293ee1f543405ae6824d6673746174757300'
    const base64Encoded = Buffer.from(encoded, 'hex').toString('base64url')

    const deviceResponse = decodeMdocDeviceResponse(base64Encoded)
    const document = deviceResponse.documents?.[0]
    if (!document) {
      throw new Error('no document')
    }
    expect(CredentialMapper.areOriginalVerifiableCredentialsEqual(document, document)).toBe(true)
  })

  it('should detect credentials', function () {
    expect(CredentialMapper.isCredential(jwtVp)).toEqual(false)
    expect(CredentialMapper.isCredential(jwtVc)).toEqual(true)
    expect(CredentialMapper.isCredential(ldpVp)).toEqual(false)
    expect(CredentialMapper.isCredential(ldpVc)).toEqual(true)
    expect(CredentialMapper.isCredential(decodedJwtVp)).toEqual(false)
    expect(CredentialMapper.isCredential(decodedJwtVc)).toEqual(true)
    expect(CredentialMapper.isCredential(decodedLdpVp)).toEqual(false)
    expect(CredentialMapper.isCredential(decodedLdpVc)).toEqual(true)
    expect(
      CredentialMapper.isCredential(
        'eyJhbGciOiJFZERTQSIsInR5cCI6InZjK3NkLWp3dCIsImtpZCI6IiN6Nk1rdHF0WE5HOENEVVk5UHJydG9TdEZ6ZUNuaHBNbWd4WUwxZ2lrY1czQnp2TlcifQ.eyJ2Y3QiOiJJZGVudGl0eUNyZWRlbnRpYWwiLCJmYW1pbHlfbmFtZSI6IkRvZSIsInBob25lX251bWJlciI6IisxLTIwMi01NTUtMDEwMSIsImFkZHJlc3MiOnsic3RyZWV0X2FkZHJlc3MiOiIxMjMgTWFpbiBTdCIsImxvY2FsaXR5IjoiQW55dG93biIsIl9zZCI6WyJOSm5tY3QwQnFCTUUxSmZCbEM2alJRVlJ1ZXZwRU9OaVl3N0E3TUh1SnlRIiwib201Wnp0WkhCLUdkMDBMRzIxQ1ZfeE00RmFFTlNvaWFPWG5UQUpOY3pCNCJdfSwiY25mIjp7Imp3ayI6eyJrdHkiOiJPS1AiLCJjcnYiOiJFZDI1NTE5IiwieCI6Im9FTlZzeE9VaUg1NFg4d0pMYVZraWNDUmswMHdCSVE0c1JnYms1NE44TW8ifX0sImlzcyI6ImRpZDprZXk6ejZNa3RxdFhORzhDRFVZOVBycnRvU3RGemVDbmhwTW1neFlMMWdpa2NXM0J6dk5XIiwiaWF0IjoxNjk4MTUxNTMyLCJfc2RfYWxnIjoic2hhLTI1NiIsIl9zZCI6WyIxQ3VyMmsyQTJvSUI1Q3NoU0lmX0FfS2ctbDI2dV9xS3VXUTc5UDBWZGFzIiwiUjF6VFV2T1lIZ2NlcGowakh5cEdIejlFSHR0VktmdDB5c3diYzlFVFBiVSIsImVEcVFwZFRYSlhiV2hmLUVzSTd6dzVYNk92WW1GTi1VWlFRTWVzWHdLUHciLCJwZERrMl9YQUtIbzdnT0Fmd0YxYjdPZENVVlRpdDJrSkhheFNFQ1E5eGZjIiwicHNhdUtVTldFaTA5bnUzQ2w4OXhLWGdtcFdFTlpsNXV5MU4xbnluX2pNayIsInNOX2dlMHBIWEY2cW1zWW5YMUE5U2R3SjhjaDhhRU5reGJPRHNUNzRZd0kiXX0.coOK8NzJmEWz4qx-qRhjo-RK7aejrSkQM9La9Cw3eWmzcja9DXrkBoQZKbIJtNoSzSPLjwK2V71W78z0miZsDQ~WyJzYWx0IiwiaXNfb3Zlcl82NSIsdHJ1ZV0~WyJzYWx0IiwiaXNfb3Zlcl8yMSIsdHJ1ZV0~WyJzYWx0IiwiZW1haWwiLCJqb2huZG9lQGV4YW1wbGUuY29tIl0~WyJzYWx0IiwiY291bnRyeSIsIlVTIl0~WyJzYWx0IiwiZ2l2ZW5fbmFtZSIsIkpvaG4iXQ~eyJhbGciOiJFZERTQSIsInR5cCI6ImtiK2p3dCJ9.eyJpYXQiOjE2OTgxNTE1MzIsIm5vbmNlIjoic2FsdCIsImF1ZCI6ImRpZDprZXk6elVDNzRWRXFxaEVIUWNndjR6YWdTUGtxRkp4dU5XdW9CUEtqSnVIRVRFVWVITG9TcVd0OTJ2aVNzbWFXank4MnkiLCJfc2RfaGFzaCI6Ii1kTUd4OGZhUnpOQm91a2EwU0R6V2JkS3JYckw1TFVmUlNQTHN2Q2xPMFkifQ.TQQLqc4ZzoKjQfAghAzC_4aaU3KCS8YqzxAJtzT124guzkv9XSHtPN8d3z181_v-ca2ATXjTRoRciozitE6wBA'
      )
    ).toEqual(true)
  })

  it('should detect presentations', function () {
    expect(CredentialMapper.isPresentation(jwtVp)).toEqual(true)
    expect(CredentialMapper.isPresentation(jwtVc)).toEqual(false)
    expect(CredentialMapper.isPresentation(ldpVp)).toEqual(true)
    expect(CredentialMapper.isPresentation(ldpVc)).toEqual(false)
    expect(CredentialMapper.isPresentation(decodedJwtVp)).toEqual(true)
    expect(CredentialMapper.isPresentation(decodedJwtVc)).toEqual(false)
    expect(CredentialMapper.isPresentation(decodedLdpVp)).toEqual(true)
    expect(CredentialMapper.isPresentation(decodedLdpVc)).toEqual(false)
    // jwt-sd credentials are not presentations
    expect(
      CredentialMapper.isPresentation(
        'eyJhbGciOiJFZERTQSIsInR5cCI6InZjK3NkLWp3dCIsImtpZCI6IiN6Nk1rdHF0WE5HOENEVVk5UHJydG9TdEZ6ZUNuaHBNbWd4WUwxZ2lrY1czQnp2TlcifQ.eyJ2Y3QiOiJJZGVudGl0eUNyZWRlbnRpYWwiLCJmYW1pbHlfbmFtZSI6IkRvZSIsInBob25lX251bWJlciI6IisxLTIwMi01NTUtMDEwMSIsImFkZHJlc3MiOnsic3RyZWV0X2FkZHJlc3MiOiIxMjMgTWFpbiBTdCIsImxvY2FsaXR5IjoiQW55dG93biIsIl9zZCI6WyJOSm5tY3QwQnFCTUUxSmZCbEM2alJRVlJ1ZXZwRU9OaVl3N0E3TUh1SnlRIiwib201Wnp0WkhCLUdkMDBMRzIxQ1ZfeE00RmFFTlNvaWFPWG5UQUpOY3pCNCJdfSwiY25mIjp7Imp3ayI6eyJrdHkiOiJPS1AiLCJjcnYiOiJFZDI1NTE5IiwieCI6Im9FTlZzeE9VaUg1NFg4d0pMYVZraWNDUmswMHdCSVE0c1JnYms1NE44TW8ifX0sImlzcyI6ImRpZDprZXk6ejZNa3RxdFhORzhDRFVZOVBycnRvU3RGemVDbmhwTW1neFlMMWdpa2NXM0J6dk5XIiwiaWF0IjoxNjk4MTUxNTMyLCJfc2RfYWxnIjoic2hhLTI1NiIsIl9zZCI6WyIxQ3VyMmsyQTJvSUI1Q3NoU0lmX0FfS2ctbDI2dV9xS3VXUTc5UDBWZGFzIiwiUjF6VFV2T1lIZ2NlcGowakh5cEdIejlFSHR0VktmdDB5c3diYzlFVFBiVSIsImVEcVFwZFRYSlhiV2hmLUVzSTd6dzVYNk92WW1GTi1VWlFRTWVzWHdLUHciLCJwZERrMl9YQUtIbzdnT0Fmd0YxYjdPZENVVlRpdDJrSkhheFNFQ1E5eGZjIiwicHNhdUtVTldFaTA5bnUzQ2w4OXhLWGdtcFdFTlpsNXV5MU4xbnluX2pNayIsInNOX2dlMHBIWEY2cW1zWW5YMUE5U2R3SjhjaDhhRU5reGJPRHNUNzRZd0kiXX0.coOK8NzJmEWz4qx-qRhjo-RK7aejrSkQM9La9Cw3eWmzcja9DXrkBoQZKbIJtNoSzSPLjwK2V71W78z0miZsDQ~WyJzYWx0IiwiaXNfb3Zlcl82NSIsdHJ1ZV0~WyJzYWx0IiwiaXNfb3Zlcl8yMSIsdHJ1ZV0~WyJzYWx0IiwiZW1haWwiLCJqb2huZG9lQGV4YW1wbGUuY29tIl0~WyJzYWx0IiwiY291bnRyeSIsIlVTIl0~WyJzYWx0IiwiZ2l2ZW5fbmFtZSIsIkpvaG4iXQ~eyJhbGciOiJFZERTQSIsInR5cCI6ImtiK2p3dCJ9.eyJpYXQiOjE2OTgxNTE1MzIsIm5vbmNlIjoic2FsdCIsImF1ZCI6ImRpZDprZXk6elVDNzRWRXFxaEVIUWNndjR6YWdTUGtxRkp4dU5XdW9CUEtqSnVIRVRFVWVITG9TcVd0OTJ2aVNzbWFXank4MnkiLCJfc2RfaGFzaCI6Ii1kTUd4OGZhUnpOQm91a2EwU0R6V2JkS3JYckw1TFVmUlNQTHN2Q2xPMFkifQ.TQQLqc4ZzoKjQfAghAzC_4aaU3KCS8YqzxAJtzT124guzkv9XSHtPN8d3z181_v-ca2ATXjTRoRciozitE6wBA'
      )
    ).toEqual(false)
  })

  it('should detect if has any proof', function () {
    expect(CredentialMapper.hasProof(jwtVp)).toEqual(true)
    expect(CredentialMapper.hasProof(decodedJwtVp)).toEqual(true)
    expect(CredentialMapper.hasProof(jwtVc)).toEqual(true)
    expect(CredentialMapper.hasProof(decodedJwtVc)).toEqual(true)
    expect(CredentialMapper.hasProof(ldpVp as unknown as OriginalVerifiablePresentation)).toEqual(true)
    expect(CredentialMapper.hasProof(ldpVc)).toEqual(true)
    expect(
      CredentialMapper.hasProof(
        'eyJhbGciOiJFZERTQSIsInR5cCI6InZjK3NkLWp3dCIsImtpZCI6IiN6Nk1rdHF0WE5HOENEVVk5UHJydG9TdEZ6ZUNuaHBNbWd4WUwxZ2lrY1czQnp2TlcifQ.eyJ2Y3QiOiJJZGVudGl0eUNyZWRlbnRpYWwiLCJmYW1pbHlfbmFtZSI6IkRvZSIsInBob25lX251bWJlciI6IisxLTIwMi01NTUtMDEwMSIsImFkZHJlc3MiOnsic3RyZWV0X2FkZHJlc3MiOiIxMjMgTWFpbiBTdCIsImxvY2FsaXR5IjoiQW55dG93biIsIl9zZCI6WyJOSm5tY3QwQnFCTUUxSmZCbEM2alJRVlJ1ZXZwRU9OaVl3N0E3TUh1SnlRIiwib201Wnp0WkhCLUdkMDBMRzIxQ1ZfeE00RmFFTlNvaWFPWG5UQUpOY3pCNCJdfSwiY25mIjp7Imp3ayI6eyJrdHkiOiJPS1AiLCJjcnYiOiJFZDI1NTE5IiwieCI6Im9FTlZzeE9VaUg1NFg4d0pMYVZraWNDUmswMHdCSVE0c1JnYms1NE44TW8ifX0sImlzcyI6ImRpZDprZXk6ejZNa3RxdFhORzhDRFVZOVBycnRvU3RGemVDbmhwTW1neFlMMWdpa2NXM0J6dk5XIiwiaWF0IjoxNjk4MTUxNTMyLCJfc2RfYWxnIjoic2hhLTI1NiIsIl9zZCI6WyIxQ3VyMmsyQTJvSUI1Q3NoU0lmX0FfS2ctbDI2dV9xS3VXUTc5UDBWZGFzIiwiUjF6VFV2T1lIZ2NlcGowakh5cEdIejlFSHR0VktmdDB5c3diYzlFVFBiVSIsImVEcVFwZFRYSlhiV2hmLUVzSTd6dzVYNk92WW1GTi1VWlFRTWVzWHdLUHciLCJwZERrMl9YQUtIbzdnT0Fmd0YxYjdPZENVVlRpdDJrSkhheFNFQ1E5eGZjIiwicHNhdUtVTldFaTA5bnUzQ2w4OXhLWGdtcFdFTlpsNXV5MU4xbnluX2pNayIsInNOX2dlMHBIWEY2cW1zWW5YMUE5U2R3SjhjaDhhRU5reGJPRHNUNzRZd0kiXX0.coOK8NzJmEWz4qx-qRhjo-RK7aejrSkQM9La9Cw3eWmzcja9DXrkBoQZKbIJtNoSzSPLjwK2V71W78z0miZsDQ~WyJzYWx0IiwiaXNfb3Zlcl82NSIsdHJ1ZV0~WyJzYWx0IiwiaXNfb3Zlcl8yMSIsdHJ1ZV0~WyJzYWx0IiwiZW1haWwiLCJqb2huZG9lQGV4YW1wbGUuY29tIl0~WyJzYWx0IiwiY291bnRyeSIsIlVTIl0~WyJzYWx0IiwiZ2l2ZW5fbmFtZSIsIkpvaG4iXQ~eyJhbGciOiJFZERTQSIsInR5cCI6ImtiK2p3dCJ9.eyJpYXQiOjE2OTgxNTE1MzIsIm5vbmNlIjoic2FsdCIsImF1ZCI6ImRpZDprZXk6elVDNzRWRXFxaEVIUWNndjR6YWdTUGtxRkp4dU5XdW9CUEtqSnVIRVRFVWVITG9TcVd0OTJ2aVNzbWFXank4MnkiLCJfc2RfaGFzaCI6Ii1kTUd4OGZhUnpOQm91a2EwU0R6V2JkS3JYckw1TFVmUlNQTHN2Q2xPMFkifQ.TQQLqc4ZzoKjQfAghAzC_4aaU3KCS8YqzxAJtzT124guzkv9XSHtPN8d3z181_v-ca2ATXjTRoRciozitE6wBA'
      )
    ).toEqual(true)
  })
})
