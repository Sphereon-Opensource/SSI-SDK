import type { PartialSdJwtKbJwt } from '@sphereon/pex/dist/main/lib/index.js'
import { calculateSdHash } from '@sphereon/pex/dist/main/lib/utils/index.js'
import { isManagedIdentifierDidResult, ManagedIdentifierOptsOrResult } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { UniqueDigitalCredential } from '@sphereon/ssi-sdk.credential-store'
import { defaultGenerateDigest } from '@sphereon/ssi-sdk.sd-jwt'
import {
  CredentialMapper,
  DocumentFormat,
  HasherSync,
  Loggers,
  OriginalVerifiableCredential,
  SdJwtDecodedVerifiableCredential,
  WrappedVerifiableCredential,
} from '@sphereon/ssi-types'
import { LOGGER_NAMESPACE, RequiredContext } from '../types'

const CLOCK_SKEW = 120
const logger = Loggers.DEFAULT.get(LOGGER_NAMESPACE)

export interface PresentationBuilderContext {
  nonce: string
  audience: string // clientId or origin
  agent: RequiredContext['agent']
  clockSkew?: number
  hasher?: HasherSync
}

/**
 * Extracts the original credential from a UniqueDigitalCredential or WrappedVerifiableCredential
 */
function extractOriginalCredential(
  credential: UniqueDigitalCredential | WrappedVerifiableCredential | OriginalVerifiableCredential,
): OriginalVerifiableCredential {
  if (typeof credential === 'string') {
    return credential
  }

  if ('digitalCredential' in credential) {
    // UniqueDigitalCredential
    const udc = credential as UniqueDigitalCredential
    if (udc.originalVerifiableCredential) {
      return udc.originalVerifiableCredential
    }
    return udc.uniformVerifiableCredential as OriginalVerifiableCredential
  }

  if ('original' in credential) {
    // WrappedVerifiableCredential
    return credential.original
  }

  // Already an OriginalVerifiableCredential
  return credential as OriginalVerifiableCredential
}

/**
 * Gets the issuer/holder identifier from ManagedIdentifierOptsOrResult
 */
function getIdentifierString(identifier: ManagedIdentifierOptsOrResult): string {
  // Check if it's a result type (has 'method' and 'opts' properties)
  if ('opts' in identifier && 'method' in identifier) {
    // It's a ManagedIdentifierResult
    if (isManagedIdentifierDidResult(identifier)) {
      return identifier.did
    }
  }
  // For opts types or other result types, use issuer if available, otherwise kid
  return identifier.issuer ?? identifier.kid ?? ''
}

/**
 * Creates a Verifiable Presentation for a given credential in the appropriate format
 * Ensures nonce/aud (or challenge/domain) are set according to OID4VP draft 28
 */
export async function createVerifiablePresentationForFormat(
  credential: UniqueDigitalCredential | WrappedVerifiableCredential | OriginalVerifiableCredential,
  identifier: ManagedIdentifierOptsOrResult,
  context: PresentationBuilderContext,
): Promise<string | object> {
  // FIXME find proper types
  const { nonce, audience, agent, clockSkew = CLOCK_SKEW } = context

  const originalCredential = extractOriginalCredential(credential)
  const documentFormat = CredentialMapper.detectDocumentType(originalCredential)

  logger.debug(`Creating VP for format: ${documentFormat}`)

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
        iat: Math.floor(Date.now() / 1000 - clockSkew),
        sd_hash: sdHash,
        nonce, // Always use the Authorization Request nonce
        aud: audience, // Always use the Client Identifier or Origin
      }

      const presentationResult = await agent.createSdJwtPresentation({
        presentation: decodedSdJwt.compactSdJwtVc,
        kb: {
          payload: kbJwtPayload as any, // FIXME
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
      }

      // Create JSON-LD VP with proof
      return await agent.createVerifiablePresentation({
        presentation: vpObject,
        proofFormat: 'lds',
        challenge: nonce, // Authorization Request nonce as challenge
        domain: audience, // Client Identifier or Origin as domain
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

      const identifierString = getIdentifierString(identifier)

      // Create VP JWT using agent method
      const vpPayload = {
        iss: identifierString,
        aud: audience, // Client Identifier or Origin
        nonce, // Authorization Request nonce
        vp: {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          type: ['VerifiablePresentation'],
          holder: identifierString,
          verifiableCredential: [vcJwt],
        },
        iat: Math.floor(Date.now() / 1000 - clockSkew),
      }

      // Use the agent's JWT creation capability
      const vpJwt = await agent.createVerifiablePresentation({
        presentation: vpPayload.vp,
        proofFormat: 'jwt',
        domain: audience,
        challenge: nonce,
        keyRef: identifier.kmsKeyRef || identifier.kid,
      })

      return vpJwt.proof?.jwt || vpJwt
    }
  }
}
