import { CredentialMapper, HasherSync, ICredential, OriginalVerifiableCredential } from '@sphereon/ssi-types'
import { VerifiableCredential } from '@veramo/core'
import { UniqueDigitalCredential } from '@sphereon/ssi-sdk.credential-store'

type InputCredential = UniqueDigitalCredential | VerifiableCredential | ICredential | OriginalVerifiableCredential

/**
 * Get an original verifiable credential. Maps to wrapped Verifiable Credential first, to get an original JWT as Veramo stores these with a special proof value
 * @param credential The input VC
 */

export const getOriginalVerifiableCredential = (credential: InputCredential): OriginalVerifiableCredential => {
  if (isUniqueDigitalCredential(credential)) {
    if (!credential.originalVerifiableCredential) {
      throw new Error('originalVerifiableCredential is not defined in UniqueDigitalCredential')
    }
    return getCredentialFromProofOrWrapped(credential.originalVerifiableCredential)
  }

  return getCredentialFromProofOrWrapped(credential)
}

const getCredentialFromProofOrWrapped = (cred: any, hasher?: HasherSync): OriginalVerifiableCredential => {
  if (typeof cred === 'object' && 'proof' in cred && 'jwt' in cred.proof && CredentialMapper.isSdJwtEncoded(cred.proof.jwt)) {
    return cred.proof.jwt
  }

  return CredentialMapper.toWrappedVerifiableCredential(cred as OriginalVerifiableCredential, { hasher }).original
}

export const isUniqueDigitalCredential = (credential: InputCredential): credential is UniqueDigitalCredential => {
  return (credential as UniqueDigitalCredential).digitalCredential !== undefined
}
