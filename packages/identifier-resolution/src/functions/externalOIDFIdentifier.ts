import type { ErrorMessage, ExternalIdentifierOIDFEntityIdOpts, ExternalIdentifierOIDFEntityIdResult, ExternalJwkInfo, TrustedAnchor } from '../types'
import type { IAgentContext } from '@veramo/core'
import type { IOIDFClient } from '@sphereon/ssi-sdk.oidf-client'
import { contextHasPlugin } from '@sphereon/ssi-sdk.agent-config'
import type { IJwsValidationResult, JwsPayload } from '../types/IJwtService'
// @ts-ignore
import * as u8a from 'uint8arrays'
const { fromString, toString } = u8a
/**
 * Resolves an OIDF Entity ID against multiple trust anchors to establish trusted relationships
 *
 * @param opts Configuration options containing the identifier to resolve and trust anchors to validate against
 * @param context Agent context that must include the OIDF client plugin and JWT verification capabilities
 *
 * @returns Promise resolving to an ExternalIdentifierOIDFEntityIdResult containing:
 *  - trustedAnchors: Record mapping trust anchors to their public key hexes
 *  - errorList: Optional record of errors encountered per trust anchor
 *  - jwks: Array of JWK information from the trust chain
 *  - trustEstablished: Boolean indicating if any trust relationships were established
 *
 * @throws Error if trust anchors are missing or JWT verification plugin is not enabled
 */
export async function resolveExternalOIDFEntityIdIdentifier(
  opts: ExternalIdentifierOIDFEntityIdOpts,
  context: IAgentContext<IOIDFClient>
): Promise<ExternalIdentifierOIDFEntityIdResult> {
  let { trustAnchors, identifier } = opts

  if (!trustAnchors || trustAnchors.length === 0) {
    return Promise.reject(Error('ExternalIdentifierOIDFEntityIdOpts is missing the trustAnchors'))
  }

  if (!contextHasPlugin(context, 'jwtVerifyJwsSignature')) {
    return Promise.reject(Error('For OIDFEntityId resolving the agent needs to have the JwtService plugin enabled'))
  }

  const trustedAnchors: Set<TrustedAnchor> = new Set<TrustedAnchor>()
  const errorList: Record<TrustedAnchor, ErrorMessage> = {}
  const jwkInfos: Array<ExternalJwkInfo> = []

  let payload: JwsPayload | undefined
  for (const trustAnchor of trustAnchors) {
    const resolveResult = await context.agent.resolveTrustChain({
      entityIdentifier: identifier,
      trustAnchors: [trustAnchor],
    })

    if (resolveResult.errorMessage || !resolveResult.trustChain) {
      errorList[trustAnchor] = resolveResult.errorMessage ?? 'unspecified'
    } else {
      const trustChain = resolveResult.trustChain
      if (trustChain.length === 0) {
        errorList[trustAnchor] = 'Trust chain is empty'
        continue
      }

      const jwt = trustChain[0]
      const jwtVerifyResult: IJwsValidationResult = await context.agent.jwtVerifyJwsSignature({ jws: jwt })

      if (jwtVerifyResult.error || jwtVerifyResult.critical) {
        errorList[trustAnchor] = jwtVerifyResult.message
        continue
      }

      if (jwtVerifyResult.jws.signatures.length === 0) {
        errorList[trustAnchor] = 'No signature was present in the trust anchor JWS'
        continue
      }

      payload = JSON.parse(toString(fromString(jwtVerifyResult.jws.payload, 'base64url')))
      const signature = jwtVerifyResult.jws.signatures[0]
      if (signature.identifier.jwks.length === 0) {
        errorList[trustAnchor] = 'No JWK was present in the trust anchor signature'
        continue
      }

      if (jwkInfos.length === 0) {
        // We need the entity JWK only once
        jwkInfos.push(...signature.identifier.jwks)
      }
      trustedAnchors.add(trustAnchor)
    }
  }

  return {
    method: 'entity_id',
    trustedAnchors: Array.from(trustedAnchors),
    ...(Object.keys(errorList).length > 0 && { errorList }),
    jwks: jwkInfos,
    jwtPayload: payload,
    trustEstablished: trustedAnchors.size > 0,
  }
}
