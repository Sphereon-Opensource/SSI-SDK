import * as fs from 'fs'
import { CredentialMapper, IVerifiableCredential } from '../src'
import { VerifiableCredential } from '@veramo/core'

function getFile(path: string) {
  return fs.readFileSync(path, 'utf-8')
}

function getFileAsJson(path: string) {
  return JSON.parse(getFile(path))
}

describe('Internal', () => {
  it('Should set type to VerifiableCredential when none is present', () => {
    const internalVerifiableCredential: VerifiableCredential = getFileAsJson('./packages/ssi-types/__tests__/vc_vp_examples/vc/vc_internal.json')
    delete internalVerifiableCredential.type
    const externalVerifiableCredential: IVerifiableCredential = CredentialMapper.toExternalVerifiableCredential(internalVerifiableCredential)

    expect(externalVerifiableCredential.type).toEqual(['VerifiableCredential'])
  })

  it('Should set correct type when type is present', () => {
    const internalVerifiableCredential: VerifiableCredential = getFileAsJson('./packages/ssi-types/__tests__/vc_vp_examples/vc/vc_internal.json')
    const externalVerifiableCredential: IVerifiableCredential = CredentialMapper.toExternalVerifiableCredential(internalVerifiableCredential)

    expect(externalVerifiableCredential.type).toEqual(['VerifiableCredential', 'PermanentResidentCard'])
  })

  it('Should set type array when type is a string', () => {
    const internalVerifiableCredential: VerifiableCredential = getFileAsJson('./packages/ssi-types/__tests__/vc_vp_examples/vc/vc_internal.json')
    internalVerifiableCredential.type = 'VerifiableCredential'
    const externalVerifiableCredential: IVerifiableCredential = CredentialMapper.toExternalVerifiableCredential(internalVerifiableCredential)

    expect(externalVerifiableCredential.type).toEqual(['VerifiableCredential'])
  })

  it('Should throw error when proof type is not present', () => {
    const internalVerifiableCredential: VerifiableCredential = getFileAsJson('./packages/ssi-types/__tests__/vc_vp_examples/vc/vc_internal.json')
    delete internalVerifiableCredential.proof.type

    expect(function () {
      CredentialMapper.toExternalVerifiableCredential(internalVerifiableCredential)
    }).toThrow('Verifiable credential proof is missing a type')
  })

  it('Should throw error when proof created date is not present', () => {
    const internalVerifiableCredential: VerifiableCredential = getFileAsJson('./packages/ssi-types/__tests__/vc_vp_examples/vc/vc_internal.json')
    delete internalVerifiableCredential.proof.created

    expect(function () {
      CredentialMapper.toExternalVerifiableCredential(internalVerifiableCredential)
    }).toThrow('Verifiable credential proof is missing a created date')
  })

  it('Should throw error when proof purpose is not present', () => {
    const internalVerifiableCredential: VerifiableCredential = getFileAsJson('./packages/ssi-types/__tests__/vc_vp_examples/vc/vc_internal.json')
    delete internalVerifiableCredential.proof.proofPurpose

    expect(function () {
      CredentialMapper.toExternalVerifiableCredential(internalVerifiableCredential)
    }).toThrow('Verifiable credential proof is missing a proof purpose')
  })

  it('Should throw error when proof verification method is not present', () => {
    const internalVerifiableCredential: VerifiableCredential = getFileAsJson('./packages/ssi-types/__tests__/vc_vp_examples/vc/vc_internal.json')
    delete internalVerifiableCredential.proof.verificationMethod

    expect(function () {
      CredentialMapper.toExternalVerifiableCredential(internalVerifiableCredential)
    }).toThrow('Verifiable credential proof is missing a verification method')
  })
})
