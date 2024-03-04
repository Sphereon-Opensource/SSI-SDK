import * as fs from 'fs'
import {
  CredentialMapper,
  ICredential,
  IVerifiableCredential,
  ICredentialSubject,
  W3CVerifiableCredential,
  JwtDecodedVerifiablePresentation,
} from '../src'

function getFile(path: string) {
  return fs.readFileSync(path, 'utf-8')
}

function getFileAsJson(path: string) {
  return JSON.parse(getFile(path))
}

describe('Uniform VC claims', () => {
  it('should set expiration date if exp is present in JWT vc', () => {
    const jwtVc: IVerifiableCredential = getFileAsJson('packages/ssi-types/__tests__/vc_vp_examples/vp/vp_general.json').verifiableCredential[0]
    jwtVc['exp' as keyof IVerifiableCredential] = (+new Date()).toString()
    const vc = CredentialMapper.toUniformCredential(jwtVc)
    expect(vc.expirationDate).toEqual(new Date(parseInt(jwtVc['exp' as keyof IVerifiableCredential] as string)).toISOString())
  })

  it('should set expiration date if exp is present in JWT vc as number', () => {
    const jwtVc: IVerifiableCredential = getFileAsJson('packages/ssi-types/__tests__/vc_vp_examples/vp/vp_general.json').verifiableCredential[0]

    jwtVc['exp' as keyof IVerifiableCredential] = new Date().valueOf()
    const vc = CredentialMapper.toUniformCredential(jwtVc)
    expect(vc.expirationDate).toEqual(new Date(jwtVc['exp' as keyof IVerifiableCredential] as string).toISOString())
  })

  it('should throw an error if expiration date and exp are different in JWT vc', () => {
    const jwtVc: IVerifiableCredential = getFileAsJson('packages/ssi-types/__tests__/vc_vp_examples/vp/vp_general.json').verifiableCredential[0]
    jwtVc['exp' as keyof IVerifiableCredential] = (+new Date()).toString()
    ;(<ICredential>jwtVc['vc' as keyof IVerifiableCredential]).expirationDate = (+new Date(
      (jwtVc['exp' as keyof IVerifiableCredential] as string) + 2
    )).toString()
    expect(() => CredentialMapper.toUniformCredential(jwtVc, { maxTimeSkewInMS: 0 })).toThrowError(
      `Inconsistent expiration dates between JWT claim (${new Date(
        parseInt(jwtVc['exp' as keyof IVerifiableCredential] as string)
      ).toISOString()}) and VC value (${(<ICredential>jwtVc['vc' as keyof IVerifiableCredential]).expirationDate})`
    )
  })

  it('should set issuer if iss is present in JWT vc', () => {
    const jwtVc: IVerifiableCredential = getFileAsJson('packages/ssi-types/__tests__/vc_vp_examples/vp/vp_general.json').verifiableCredential[0]
    ;(<ICredential>jwtVc['vc' as keyof IVerifiableCredential]).issuer
    const vc = CredentialMapper.toUniformCredential(jwtVc)
    expect(vc.issuer).toEqual(jwtVc['iss' as keyof IVerifiableCredential])
  })

  it('should throw an error if issuer and iss are different in JWT vc', () => {
    const jwtVc: IVerifiableCredential = getFileAsJson('packages/ssi-types/__tests__/vc_vp_examples/vp/vp_general.json').verifiableCredential[0]
    jwtVc['iss' as keyof IVerifiableCredential] = 'did:test:456'
    expect(() => CredentialMapper.toUniformCredential(jwtVc)).toThrowError(
      `Inconsistent issuers between JWT claim (${jwtVc['iss' as keyof IVerifiableCredential]}) and VC value (${
        (<ICredential>jwtVc['vc' as keyof IVerifiableCredential]).issuer
      })`
    )
  })

  it('should set issuance date if nbf is present in JWT vc', () => {
    const jwtVc: IVerifiableCredential = getFileAsJson('packages/ssi-types/__tests__/vc_vp_examples/vp/vp_general.json').verifiableCredential[0]
    jwtVc['nbf' as keyof IVerifiableCredential] = (+new Date()).toString()
    ;(<ICredential>jwtVc['vc' as keyof IVerifiableCredential]).issuanceDate = new Date(
      parseInt(jwtVc['nbf' as keyof IVerifiableCredential] as string)
    ).toISOString()
    const vc = CredentialMapper.toUniformCredential(jwtVc)
    expect(vc.issuanceDate).toEqual(new Date(parseInt(jwtVc['nbf' as keyof IVerifiableCredential] as string)).toISOString())
  })

  it('should throw an error if issuance date and nbf are different in JWT vc', () => {
    const jwtVc: IVerifiableCredential = getFileAsJson('packages/ssi-types/__tests__/vc_vp_examples/vp/vp_general.json').verifiableCredential[0]
    const nbf = new Date().valueOf()
    jwtVc['nbf' as keyof IVerifiableCredential] = nbf / 1000
    ;(<ICredential>jwtVc['vc' as keyof IVerifiableCredential]).issuanceDate = new Date(+new Date() + 2).toISOString()
    expect(() => CredentialMapper.toUniformCredential(jwtVc, { maxTimeSkewInMS: 10 })).toThrowError(
      `Inconsistent issuance dates between JWT claim (${new Date(nbf).toISOString().replace(/\.\d\d\dZ/, 'Z')}) and VC value (${
        (<ICredential>jwtVc['vc' as keyof IVerifiableCredential]).issuanceDate
      })`
    )
  })

  it('should set credentialSubject.id if sub is present in JWT vc', () => {
    const jwtVc: IVerifiableCredential = getFileAsJson('packages/ssi-types/__tests__/vc_vp_examples/vp/vp_general.json').verifiableCredential[0]
    jwtVc['sub' as keyof IVerifiableCredential] = (<ICredentialSubject>(<ICredential>jwtVc['vc' as keyof IVerifiableCredential]).credentialSubject).id
    const vc = CredentialMapper.toUniformCredential(jwtVc)
    expect(!Array.isArray(vc.credentialSubject) && vc.credentialSubject.id).toEqual(jwtVc['sub' as keyof IVerifiableCredential])
  })

  it('should throw an error if credentialSubject.id and sub are different in JWT vc', () => {
    const jwtVc: IVerifiableCredential = getFileAsJson('packages/ssi-types/__tests__/vc_vp_examples/vp/vp_general.json').verifiableCredential[0]
    jwtVc['sub' as keyof IVerifiableCredential] = 'did:test:123'
    expect(() => CredentialMapper.toUniformCredential(jwtVc)).toThrowError(
      `Inconsistent credential subject ids between JWT claim (${jwtVc['sub' as keyof IVerifiableCredential]}) and VC value (${
        (<ICredentialSubject>(<ICredential>jwtVc['vc' as keyof IVerifiableCredential]).credentialSubject).id
      })`
    )
  })

  it('should set id if jti is present in JWT vc', () => {
    const jwtVc: IVerifiableCredential = getFileAsJson('packages/ssi-types/__tests__/vc_vp_examples/vp/vp_general.json').verifiableCredential[0]
    jwtVc['jti' as keyof IVerifiableCredential] = (<ICredential>jwtVc['vc' as keyof IVerifiableCredential]).id
    const vc = CredentialMapper.toUniformCredential(jwtVc)
    expect(vc.id).toEqual(jwtVc['jti' as keyof IVerifiableCredential])
  })

  it('should throw an error if id and jti are different in JWT vc', () => {
    const jwtVc: IVerifiableCredential = getFileAsJson('packages/ssi-types/__tests__/vc_vp_examples/vp/vp_general.json').verifiableCredential[0]
    jwtVc['jti' as keyof IVerifiableCredential] = 'test'
    expect(() => CredentialMapper.toUniformCredential(jwtVc)).toThrowError(
      `Inconsistent credential ids between JWT claim (${jwtVc['jti' as keyof IVerifiableCredential]}) and VC value (${
        (<ICredential>jwtVc['vc' as keyof IVerifiableCredential]).id
      })`
    )
  })

  it('should work with jsonLD VC from Diwala', () => {
    const ldpVc: IVerifiableCredential = getFileAsJson('packages/ssi-types/__tests__/vc_vp_examples/vc/vc_edu-plugfest-diwala.json')
    const vc = CredentialMapper.toUniformCredential(ldpVc)
    expect(vc.issuanceDate).toEqual('2022-11-04T12:32:03Z')
  })

  it('should work with jwt VC from Velocity', () => {
    const jwtVc: W3CVerifiableCredential = getFile('packages/ssi-types/__tests__/vc_vp_examples/vc/vc_edu-plugfest-velocity.jwt')
    const vc = CredentialMapper.toUniformCredential(jwtVc)
    expect(vc.issuanceDate).toEqual('2022-11-07T21:29:29Z')
  })
})

describe('Uniform VP claims', () => {
  it('JWT Encoded VP should populate response', () => {
    const jwtEncodedVp = getFile('./packages/ssi-types/__tests__/vc_vp_examples/vp/vp_universityDegree.jwt')
    const vp = CredentialMapper.toUniformPresentation(jwtEncodedVp)
    // vp should be decoded
    expect(vp.holder).toEqual('did:example:ebfeb1f712ebc6f1c276e12ec21')
    // vc should be decoded for a uniform vp
    const vc = vp.verifiableCredential?.[0] as IVerifiableCredential
    expect(!Array.isArray(vc.credentialSubject) && vc.credentialSubject.degree.type).toEqual('BachelorDegree')
  })

  it('JWT Decoded VP should populate response', () => {
    const jwtEncodedVp = getFile('./packages/ssi-types/__tests__/vc_vp_examples/vp/vp_universityDegree.jwt')
    const jwtDecodedVp = CredentialMapper.toWrappedVerifiablePresentation(jwtEncodedVp).decoded
    const vp = CredentialMapper.toUniformPresentation(jwtDecodedVp as JwtDecodedVerifiablePresentation)
    // vp should be decoded
    expect(vp.holder).toEqual('did:example:ebfeb1f712ebc6f1c276e12ec21')
    // vc should be decoded for a uniform vp
    const vc = vp.verifiableCredential?.[0] as IVerifiableCredential
    expect(!Array.isArray(vc.credentialSubject) && vc.credentialSubject.degree.type).toEqual('BachelorDegree')
  })

  it('JSON-LD VP String should populate response', () => {
    const jsonLdVpAsStr = getFile('./packages/ssi-types/__tests__/vc_vp_examples/vp/vp_subject_is_holder.json')
    const vp = CredentialMapper.toUniformPresentation(jsonLdVpAsStr)
    // vp should be decoded
    expect((vp.verifiableCredential?.[0] as IVerifiableCredential).issuer).toEqual('did:example:123')
  })
  it('JSON-LD VP Object should populate response', () => {
    const jsonLdVp = getFileAsJson('./packages/ssi-types/__tests__/vc_vp_examples/vp/vp_subject_is_holder.json')
    const vp = CredentialMapper.toUniformPresentation(jsonLdVp)
    // vp should be decoded
    expect((vp.verifiableCredential?.[0] as IVerifiableCredential).issuer).toEqual('did:example:123')
  })
})
