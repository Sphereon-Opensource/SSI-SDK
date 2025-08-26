import { UniqueDigitalCredential } from '@sphereon/ssi-sdk.credential-store'
import { CredentialMapper, HasherSync, OriginalVerifiableCredential } from '@sphereon/ssi-types'
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

  if (CredentialMapper.isJwtDecodedCredential(originalVerifiableCredential)) {
    return Dcql.toDcqlJwtCredential(originalVerifiableCredential)
  } else if (CredentialMapper.isSdJwtDecodedCredential(originalVerifiableCredential)) {
    return Dcql.toDcqlSdJwtCredential(originalVerifiableCredential)
  } else if (CredentialMapper.isMsoMdocDecodedCredential(originalVerifiableCredential)) {
    return Dcql.toDcqlMdocCredential(originalVerifiableCredential)
  } else if (CredentialMapper.isW3cCredential(originalVerifiableCredential)) {
    return Dcql.toDcqlJsonLdCredential(originalVerifiableCredential)
  }

  throw Error(`Unable to map credential to DCQL credential. Credential: ${JSON.stringify(originalVerifiableCredential)}`)
}
