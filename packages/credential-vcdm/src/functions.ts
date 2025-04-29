import {
  CredentialPayload,
  IAgentContext, ICredentialStatusVerifier,
  IIdentifier,
  IKey,
  IssuerType,
  PresentationPayload,
  VerifiableCredential,
  W3CVerifiableCredential,
  W3CVerifiablePresentation
} from '@veramo/core'
import { isDefined } from '@veramo/utils'
import { decodeJWT } from 'did-jwt'

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
  input?:
    | W3CVerifiableCredential
    | W3CVerifiablePresentation
    | CredentialPayload
    | PresentationPayload
    | null,
  options: { removeParameters?: boolean } = {}
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


export function pickSigningKey(identifier: IIdentifier, keyRef?: string): IKey {
  let key: IKey | undefined

  if (!keyRef) {
    key = identifier.keys.find((k) => k.type === 'Secp256k1' || k.type === 'Ed25519' || k.type === 'Secp256r1')
    if (!key) throw Error('key_not_found: No signing key for ' + identifier.did)
  } else {
    key = identifier.keys.find((k) => k.kid === keyRef)
    if (!key) throw Error('key_not_found: No signing key for ' + identifier.did + ' with kid ' + keyRef)
  }

  return key as IKey
}

export async function isRevoked(credential: VerifiableCredential, context: IAgentContext<ICredentialStatusVerifier>): Promise<boolean> {
  if (!credential.credentialStatus) return false

  if (typeof context.agent.checkCredentialStatus === 'function') {
    const status = await context.agent.checkCredentialStatus({ credential })
    return status?.revoked == true || status?.verified === false
  }

  throw new Error(`invalid_setup: The credential status can't be verified because there is no ICredentialStatusVerifier plugin installed.`)
}
