import { UniqueDigitalCredential } from '@sphereon/ssi-sdk.credential-store'
import { calculateSdHash, defaultGenerateDigest, PartialSdJwtKbJwt } from '@sphereon/ssi-sdk.sd-jwt'

import {
  CredentialMapper,
  DocumentFormat,
  Loggers,
  OriginalVerifiableCredential,
  SdJwtDecodedVerifiableCredential,
  WrappedVerifiableCredential,
} from '@sphereon/ssi-types'
import { LOGGER_NAMESPACE, RequiredContext } from '../types'

const logger = Loggers.DEFAULT.get(LOGGER_NAMESPACE)
const CLOCK_SKEW = 120 // TODO make adjustable?

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
  credential: UniqueDigitalCredential,
  agent: RequiredContext['agent'],
): Promise<string | Record<string, any>> {
  logger.debug(`Creating LinkedVP presentation for ${holderDid} of credential ${credential.id}`)

  const identifier = await agent.identifierManagedGet({ identifier: holderDid })
  const originalCredential = extractOriginalCredential(credential)
  const documentFormat = CredentialMapper.detectDocumentType(originalCredential)
  switch (documentFormat) {
    case DocumentFormat.SD_JWT_VC: {
      // SD-JWT with KB-JWT
      const decodedSdJwt = await CredentialMapper.decodeSdJwtVcAsync(
        typeof originalCredential === 'string' ? originalCredential : (originalCredential as SdJwtDecodedVerifiableCredential).compactSdJwtVc,
        defaultGenerateDigest,
      )

      const hashAlg = decodedSdJwt.signedPayload._sd_alg ?? 'sha-256'
      const sdHash = calculateSdHash(decodedSdJwt.compactSdJwtVc, hashAlg, defaultGenerateDigest)
      const kbJwtPayload: PartialSdJwtKbJwt['payload'] = {
        iat: Math.floor(Date.now() / 1000 - CLOCK_SKEW),
        sd_hash: sdHash,
      }

      const presentationResult = await agent.createSdJwtPresentation({
        presentation: decodedSdJwt.compactSdJwtVc,
        kb: {
          payload: kbJwtPayload as any, // FIXME?
        },
      })

      return presentationResult.presentation
    }
    case DocumentFormat.JSONLD: {
      // JSON-LD VC - create JSON-LD VP with challenge and domain in proof
      const vcObject = typeof originalCredential === 'string' ? JSON.parse(originalCredential) : originalCredential

      const vpObject = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiablePresentation'],
        verifiableCredential: [vcObject],
        holder: holderDid,
      }

      // Create JSON-LD VP with proof
      return await agent.createVerifiablePresentation({
        presentation: vpObject,
        proofFormat: 'lds',
        keyRef: identifier.kmsKeyRef || identifier.kid,
      })
    }
    case DocumentFormat.MSO_MDOC: {
      // ISO mdoc - create mdoc VP token
      // This is a placeholder implementation
      // Full implementation would require:
      // 1. Decode the mdoc using CredentialMapper or mdoc utilities
      // 2. Build proper mdoc VP token with session transcript
      // 3. Include nonce/audience in the session transcript
      logger.warning('mso_mdoc format has basic support - production use requires proper mdoc VP token implementation')

      return originalCredential
    }
    default: {
      // JWT VC - create JWT VP with nonce and aud in payload
      const vcJwt = typeof originalCredential === 'string' ? originalCredential : JSON.stringify(originalCredential)

      // Create VP JWT using agent method
      const vpPayload = {
        iss: holderDid,
        vp: {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          type: ['VerifiablePresentation'],
          holder: holderDid,
          verifiableCredential: [vcJwt],
        },
        iat: Math.floor(Date.now() / 1000 - CLOCK_SKEW),
        exp: Math.floor(Date.now() / 1000 + 600 + CLOCK_SKEW), // 10 minutes
      }

      // Use the agent's JWT creation capability
      const vpJwt = await agent.createVerifiablePresentation({
        presentation: vpPayload.vp,
        proofFormat: 'jwt',
        keyRef: identifier.kmsKeyRef || identifier.kid,
      })

      return (vpJwt.proof && 'jwt' in vpJwt.proof && vpJwt.proof.jwt) || vpJwt
    }
  }
}
