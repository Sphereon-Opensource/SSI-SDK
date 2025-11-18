import { UniqueDigitalCredential } from '@sphereon/ssi-sdk.credential-store'
import { Loggers, OriginalVerifiableCredential, WrappedVerifiableCredential } from '@sphereon/ssi-types'
import type { PresentationPayload } from '@veramo/core'
import { W3CVerifiableCredential } from '@veramo/core/src/types/vc-data-model'
import { LOGGER_NAMESPACE, RequiredContext } from '../types'

const logger = Loggers.DEFAULT.get(LOGGER_NAMESPACE)

/**
 * Extracts the original credential from various wrapper types
 */
function extractOriginalCredential(
  credential: UniqueDigitalCredential | WrappedVerifiableCredential | OriginalVerifiableCredential,
): OriginalVerifiableCredential {
  if (typeof credential === 'string') {
    return credential
  }

  if ('digitalCredential' in credential) {
    const udc = credential as UniqueDigitalCredential
    if (udc.originalVerifiableCredential) {
      return udc.originalVerifiableCredential
    }
    return udc.uniformVerifiableCredential as OriginalVerifiableCredential
  }

  if ('original' in credential) {
    return credential.original
  }

  return credential as OriginalVerifiableCredential
}

/**
 * Creates a Verifiable Presentation for LinkedVP publishing
 * Contains multiple credentials in a single JWT VP
 * No nonce or audience since this is for publishing, not responding to verification
 */
export async function createLinkedVPPresentation(
  holderDid: string,
  credentials: UniqueDigitalCredential[],
  agent: RequiredContext['agent'],
): Promise<string | Record<string, any>> {
  if (credentials.length === 0) {
    return Promise.reject(Error('Cannot create LinkedVP presentation with zero credentials'))
  }

  logger.debug(`Creating LinkedVP presentation for ${holderDid} with ${credentials.length} credentials`)

  const identifier = await agent.identifierManagedGet({ identifier: holderDid })

  // Extract and prepare credentials
  const verifiableCredentials = credentials.map((credential) => {
    const original = extractOriginalCredential(credential)
    // Keep as-is if string (JWT), otherwise convert to object
    return typeof original === 'string' ? original : original
  })

  // Create VP structure
  const vpObject: PresentationPayload = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiablePresentation'],
    holder: holderDid,
    verifiableCredential: verifiableCredentials as W3CVerifiableCredential[],
  }

  // Create and sign the VP as JWT
  const result = await agent.createVerifiablePresentation({
    presentation: vpObject,
    proofFormat: 'jwt',
    keyRef: identifier.kmsKeyRef || identifier.kid,
  })

  // Extract JWT from result
  if (typeof result === 'string') {
    return result
  }

  if (result.proof && 'jws' in result.proof) {
    return result.proof.jws
  }

  return Promise.reject(Error('Failed to create JWT VP - no JWT in result'))
}
