import * as fs from 'fs'
import {
  CredentialMapper,
  IVerifiableCredential,
  IVerifiablePresentation,
  JwtDecodedVerifiableCredential,
  JwtDecodedVerifiablePresentation,
  OriginalVerifiableCredential,
  OriginalVerifiablePresentation,
} from '../src'

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
  const ldpVc: OriginalVerifiableCredential = getFileAsJson('packages/ssi-types/__tests__/vc_vp_examples/vc/vc-driverLicense.json')

  const decodedJwtVp = CredentialMapper.decodeVerifiablePresentation(jwtVp) as JwtDecodedVerifiablePresentation
  const decodedJwtVc = CredentialMapper.decodeVerifiableCredential(jwtVc) as JwtDecodedVerifiableCredential
  const decodedLdpVp = CredentialMapper.decodeVerifiablePresentation(ldpVp) as IVerifiablePresentation
  const decodedLdpVc = CredentialMapper.decodeVerifiableCredential(ldpVc) as IVerifiableCredential

  it('Decoded Jwt VP should have sub', () => {
    expect(decodedJwtVp.iss).toEqual('did:example:ebfeb1f712ebc6f1c276e12ec21')
  })

  it('Decoded Jwt VC should have sub', () => {
    expect(decodedJwtVc.sub).toEqual('did:example:ebfeb1f712ebc6f1c276e12ec21')
  })

  it('Decoded JsonLd VP should have sub', () => {
    expect((decodedLdpVp.verifiableCredential[1] as IVerifiableCredential).issuer).toEqual('did:foo:123')
  })
  it('Decoded Jsonld VC should have sub', () => {
    expect(decodedLdpVc.issuer).toEqual('did:key:z6MkuDyqwjCVhFFQEZdS5utguwYD2KRig2PEb9qbfP9iqwn9')
  })

  it('text-stringified JsonLD should be decoded', () => {
    expect(CredentialMapper.decodeVerifiablePresentation(JSON.stringify(ldpVp)).verifiableCredential).toBeDefined()
    expect(CredentialMapper.decodeVerifiableCredential(JSON.stringify(ldpVc)).credentialSubject.id).toEqual('did:example:b34ca6cd37bbf23')
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
})
