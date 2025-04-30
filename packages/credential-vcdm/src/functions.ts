import type {
  CredentialPayload,
  IAgentContext,
  ICredentialStatusVerifier,
  IDIDManager,
  IIdentifier,
  IResolver,
  IssuerType,
  PresentationPayload,
  VerifiableCredential,
  W3CVerifiableCredential,
  W3CVerifiablePresentation,
} from '@veramo/core'
import { _ExtendedIKey, isDefined, processEntryToArray } from '@veramo/utils'
import { decodeJWT } from 'did-jwt'
import {
  addVcdmContextIfNeeded,
  isVcdm1Credential,
  isVcdm2Credential,
  VCDM_CREDENTIAL_CONTEXT_V1,
  VCDM_CREDENTIAL_CONTEXT_V2,
} from '@sphereon/ssi-types'
import { ICreateVerifiablePresentationLDArgs } from './types'
import { getKey } from '@sphereon/ssi-sdk-ext.did-utils'

/**
 * Decodes a credential or presentation and returns the issuer ID
 * `iss` from a JWT or `issuer`/`issuer.id` from a VC or `holder` from a VP
 *
 * @param input - the credential or presentation whose issuer/holder needs to be extracted.
 * @param options - options for the extraction
 *   removeParameters - Remove all DID parameters from the issuer ID
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
export function extractIssuer(
  input?: W3CVerifiableCredential | W3CVerifiablePresentation | CredentialPayload | PresentationPayload | null,
  options: { removeParameters?: boolean } = {},
): string {
  if (!isDefined(input)) {
    return ''
  } else if (typeof input === 'string') {
    // JWT
    try {
      const { payload } = decodeJWT(input.split(`~`)[0])
      const iss = payload.iss ?? ''
      return !!options.removeParameters ? removeDIDParameters(iss) : iss
    } catch (e: any) {
      return ''
    }
  } else {
    // JSON
    let iss: IssuerType
    if (input.issuer) {
      iss = input.issuer
    } else if (input.holder) {
      iss = input.holder
    } else {
      iss = ''
    }
    if (typeof iss !== 'string') iss = iss.id ?? ''
    return !!options.removeParameters ? removeDIDParameters(iss) : iss
  }
}

/**
 * Remove all DID parameters from a DID url after the query part (?)
 *
 * @param did - the DID URL
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
export function removeDIDParameters(did: string): string {
  return did.replace(/\?.*$/, '')
}

export async function pickSigningKey(
  { identifier, kmsKeyRef }: { identifier: IIdentifier; kmsKeyRef?: string },
  context: IAgentContext<IResolver & IDIDManager>,
): Promise<_ExtendedIKey> {
  const key = await getKey({ identifier, vmRelationship: 'assertionMethod', kmsKeyRef: kmsKeyRef }, context)
  return key
}

export async function isRevoked(credential: VerifiableCredential, context: IAgentContext<ICredentialStatusVerifier>): Promise<boolean> {
  if (!credential.credentialStatus) return false

  if (typeof context.agent.checkCredentialStatus === 'function') {
    const status = await context.agent.checkCredentialStatus({ credential })
    return status?.revoked == true || status?.verified === false
  }

  throw new Error(`invalid_setup: The credential status can't be verified because there is no ICredentialStatusVerifier plugin installed.`)
}

export function preProcessCredentialPayload({ credential, now = new Date() }: { credential: CredentialPayload; now?: number | Date }) {
  const credentialContext = addVcdmContextIfNeeded(credential?.['@context'])
  const isVdcm1 = isVcdm1Credential(credential)
  const isVdcm2 = isVcdm2Credential(credential)
  const credentialType = processEntryToArray(credential?.type, 'VerifiableCredential')
  let issuanceDate = credential?.validFrom ?? credential?.issuanceDate ?? (typeof now === 'number' ? new Date(now) : now).toISOString()
  let expirationDate = credential?.validUntil ?? credential?.expirationDate
  if (issuanceDate instanceof Date) {
    issuanceDate = issuanceDate.toISOString()
  }
  const credentialPayload: CredentialPayload = {
    ...credential,
    '@context': credentialContext,
    type: credentialType,
    ...(isVdcm1 && { issuanceDate }),
    ...(isVdcm1 && expirationDate && { expirationDate }),
    ...(isVdcm2 && { validFrom: issuanceDate }),
    ...(isVdcm2 && expirationDate && { validUntil: expirationDate }),
  }
  if (isVdcm1) {
    delete credentialPayload.validFrom
    delete credentialPayload.validUntil
  } else if (isVdcm2) {
    delete credentialPayload.issuanceDate
    delete credentialPayload.expirationDate
  }

  // debug(JSON.stringify(credentialPayload))

  const issuer = extractIssuer(credentialPayload, { removeParameters: true })
  if (!issuer || typeof issuer === 'undefined') {
    throw new Error('invalid_argument: args.credential.issuer must not be empty')
  }
  return { credential: credentialPayload, issuer, now }
}

export function preProcessPresentation(args: ICreateVerifiablePresentationLDArgs) {
  const { presentation, now = new Date() } = args
  const credentials = presentation?.verifiableCredential ?? []
  const v1Credential = credentials.find((cred) => typeof cred === 'object' && cred['@context'].includes(VCDM_CREDENTIAL_CONTEXT_V1))
    ? VCDM_CREDENTIAL_CONTEXT_V1
    : undefined
  const v2Credential = credentials.find((cred) => typeof cred === 'object' && cred['@context'].includes(VCDM_CREDENTIAL_CONTEXT_V2))
    ? VCDM_CREDENTIAL_CONTEXT_V2
    : undefined
  const presentationContext = addVcdmContextIfNeeded(
    args?.presentation?.['@context'] ?? [],
    v2Credential ?? v1Credential ?? VCDM_CREDENTIAL_CONTEXT_V2,
  )
  const presentationType = processEntryToArray(args?.presentation?.type, 'VerifiablePresentation')

  let issuanceDate = presentation?.validFrom ?? presentation?.issuanceDate ?? (typeof now === 'number' ? new Date(now) : now).toISOString()
  if (issuanceDate instanceof Date) {
    issuanceDate = issuanceDate.toISOString()
  }
  const presentationPayload: PresentationPayload = {
    ...presentation,
    '@context': presentationContext,
    type: presentationType,
    ...(v1Credential && { issuanceDate }), // V1 only for JWT, but we remove it in the jsonld processor anyway
    ...(v2Credential && { validFrom: issuanceDate }),
  }
  // Workaround for bug in TypeError: Cannot read property 'length' of undefined
  //     at VeramoEd25519Signature2018.preSigningPresModification
  /*if (!presentation.verifier) {
        presentation.verifier = []
      }*/

  if (!isDefined(presentationPayload.holder) || !presentationPayload.holder) {
    throw new Error('invalid_argument: args.presentation.holderDID must not be empty')
  }
  if (presentationPayload.verifiableCredential) {
    presentationPayload.verifiableCredential = presentationPayload.verifiableCredential.map((cred) => {
      // map JWT credentials to their canonical form
      if (typeof cred !== 'string' && cred.proof.jwt) {
        return cred.proof.jwt
      } else {
        return cred
      }
    })
  }
  return { presentation: presentationPayload, holder: removeDIDParameters(presentationPayload.holder) }
}
