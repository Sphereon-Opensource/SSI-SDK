import { UniqueDigitalCredential } from '@sphereon/ssi-sdk.credential-store'
import {
  CredentialMapper,
  decodeMdocIssuerSigned,
  HasherSync,
  OriginalVerifiableCredential,
  WrappedMdocCredential,
  type WrappedSdJwtVerifiableCredential,
  type WrappedW3CVerifiableCredential,
} from '@sphereon/ssi-types'
import { Dcql } from '@sphereon/did-auth-siop'
import { DcqlCredential } from 'dcql'
import { isUniqueDigitalCredential } from './CredentialUtils'

export function convertToDcqlCredentials(credential: UniqueDigitalCredential | OriginalVerifiableCredential, hasher?: HasherSync): DcqlCredential {
  let originalVerifiableCredential
  if (isUniqueDigitalCredential(credential)) {
    if (!credential.originalVerifiableCredential) {
      throw new Error('originalVerifiableCredential is not defined in UniqueDigitalCredential')
    }
    originalVerifiableCredential = CredentialMapper.decodeVerifiableCredential(credential.originalVerifiableCredential, hasher)
  } else {
    originalVerifiableCredential = CredentialMapper.decodeVerifiableCredential(credential as OriginalVerifiableCredential, hasher)
  }

  if (!originalVerifiableCredential) {
    throw new Error('No payload found')
  }

  // Robustness: an older ssi-types' decodeVerifiableCredential returns the raw base64url string for an mdoc
  // instead of a decoded MdocDocument. Decode it here so the mso_mdoc branch below matches.
  if (CredentialMapper.isMsoMdocOid4VPEncoded(originalVerifiableCredential)) {
    originalVerifiableCredential = decodeMdocIssuerSigned(originalVerifiableCredential)
  }

  if (CredentialMapper.isJwtDecodedCredential(originalVerifiableCredential)) {
    return Dcql.toDcqlJwtCredential(CredentialMapper.toWrappedVerifiableCredential(originalVerifiableCredential) as WrappedW3CVerifiableCredential)
  } else if (CredentialMapper.isSdJwtDecodedCredential(originalVerifiableCredential)) {
    // FIXME: SD-JWT VC vs VCDM2 + SD-JWT would need to be handled here
    return Dcql.toDcqlSdJwtCredential(
      CredentialMapper.toWrappedVerifiableCredential(originalVerifiableCredential) as WrappedSdJwtVerifiableCredential,
    )
  } else if (CredentialMapper.isMsoMdocDecodedCredential(originalVerifiableCredential)) {
    return Dcql.toDcqlMdocCredential(CredentialMapper.toWrappedVerifiableCredential(originalVerifiableCredential) as WrappedMdocCredential)
  } else if (CredentialMapper.isW3cCredential(originalVerifiableCredential)) {
    return Dcql.toDcqlJsonLdCredential(CredentialMapper.toWrappedVerifiableCredential(originalVerifiableCredential) as WrappedW3CVerifiableCredential)
  }

  throw Error(`Unable to map credential to DCQL credential. Credential: ${JSON.stringify(originalVerifiableCredential)}`)
}
