import { CredentialMapper, HasherSync, ICredential, IVerifiableCredential, OriginalVerifiableCredential } from '@sphereon/ssi-types'
import { VerifiableCredential } from '@veramo/core'
import { UniqueDigitalCredential } from '@sphereon/ssi-sdk.credential-store'

/**
 * Return the type(s) of a VC minus the VerifiableCredential type which should always be present
 * @param credential The input credential
 */
export const getCredentialTypeAsString = (credential: ICredential | VerifiableCredential): string => {
  if (!credential.type) {
    return 'Verifiable Credential'
  } else if (typeof credential.type === 'string') {
    return credential.type
  }
  return credential.type.filter((type: string): boolean => type !== 'VerifiableCredential').join(', ')
}

/**
 * Returns a Unique Verifiable Credential (with hash) as stored in Veramo, based upon matching the id of the input VC or the proof value of the input VC
 * @param uniqueVCs The Unique VCs to search in
 * @param searchVC The VC to search for in the unique VCs array
 */
export const getMatchingUniqueDigitalCredential = (
  uniqueVCs: UniqueDigitalCredential[],
  searchVC: OriginalVerifiableCredential,
): UniqueDigitalCredential | undefined => {
  // Since an ID is optional in a VC according to VCDM, and we really need the matches, we have a fallback match on something which is guaranteed to be unique for any VC (the proof(s))
  return uniqueVCs.find(
    (uniqueVC: UniqueDigitalCredential) =>
      (typeof searchVC !== 'string' &&
        (uniqueVC.id === (<IVerifiableCredential>searchVC).id ||
          (uniqueVC.originalVerifiableCredential as VerifiableCredential).proof === (<IVerifiableCredential>searchVC).proof)) ||
      (typeof searchVC === 'string' && (uniqueVC.uniformVerifiableCredential as VerifiableCredential)?.proof?.jwt === searchVC) ||
      // We are ignoring the signature of the sd-jwt as PEX signs the vc again and it will not match anymore with the jwt in the proof of the stored jsonld vc
      (typeof searchVC === 'string' &&
        CredentialMapper.isSdJwtEncoded(searchVC) &&
        uniqueVC.uniformVerifiableCredential?.proof &&
        'jwt' in uniqueVC.uniformVerifiableCredential.proof &&
        uniqueVC.uniformVerifiableCredential.proof.jwt?.split('.')?.slice(0, 2)?.join('.') === searchVC.split('.')?.slice(0, 2)?.join('.')),
  )
}

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
