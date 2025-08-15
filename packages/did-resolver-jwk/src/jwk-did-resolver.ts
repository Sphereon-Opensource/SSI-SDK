import { IParsedDID, parseDid } from '@sphereon/ssi-types'
import base64url from 'base64url'
import { DIDResolutionOptions, DIDResolutionResult, DIDResolver, JsonWebKey } from 'did-resolver'
import { ContextType, ENC_KEY_ALGS, KeyUse, SIG_KEY_ALGS, VerificationType, VocabType } from './types/jwk-resolver-types'

export const resolveDidJwk: DIDResolver = async (didUrl: string, options?: DIDResolutionOptions): Promise<DIDResolutionResult> => {
  return resolve(didUrl, options)
}

const resolve = async (didUrl: string, _options?: DIDResolutionOptions): Promise<DIDResolutionResult> => {
  let parsedDid: IParsedDID
  try {
    parsedDid = parseDid(didUrl)
  } catch (error: unknown) {
    // Error from did resolution spec
    return errorResponseFrom('invalidDid')
  }

  if (parsedDid.method !== 'jwk') {
    // Error from did resolution spec
    return errorResponseFrom('unsupportedDidMethod')
  }

  let jwk: JsonWebKey
  try {
    jwk = JSON.parse(base64url.decode(parsedDid.id, 'UTF-8'))
  } catch (error: unknown) {
    // Error from did resolution spec
    return errorResponseFrom('invalidDid')
  }

  // We need this since DIDResolutionResult does not allow for an object in the array
  const context = [ContextType.DidDocument, { '@vocab': VocabType.Jose }] as never

  // We add the alg check to ensure max compatibility with implementations that do not export the use property
  const enc = (jwk.use && jwk.use === KeyUse.Encryption) || (jwk.alg && ENC_KEY_ALGS.includes(jwk.alg))
  const sig = (jwk.use && jwk.use === KeyUse.Signature) || (jwk.alg && SIG_KEY_ALGS.includes(jwk.alg))

  const didResolution: DIDResolutionResult = {
    didResolutionMetadata: {
      contentType: 'application/did+ld+json',
      pattern: '^(did:jwk:.+)$',
      did: {
        didString: parsedDid.did,
        methodSpecificId: parsedDid.id,
        method: 'jwk',
      },
    },

    didDocument: {
      '@context': context,
      id: parsedDid.did,
      verificationMethod: [
        {
          id: `${parsedDid.did}#0`,
          type: VerificationType.JsonWebKey2020,
          controller: parsedDid.did,
          publicKeyJwk: jwk,
        },
      ],
      ...(sig && { assertionMethod: [`${parsedDid.did}#0`] }),
      ...(sig && { authentication: [`${parsedDid.did}#0`] }),
      ...(sig && { capabilityInvocation: [`${parsedDid.did}#0`] }),
      ...(sig && { capabilityDelegation: [`${parsedDid.did}#0`] }),
      ...(enc && { keyAgreement: [`${parsedDid.did}#0`] }),
    },
    didDocumentMetadata: {},
  }

  return didResolution
}

const errorResponseFrom = async (error: string): Promise<DIDResolutionResult> => {
  return {
    didResolutionMetadata: {
      error,
    },
    didDocument: null,
    didDocumentMetadata: {},
  }
}

export function getDidJwkResolver() {
  return { jwk: resolveDidJwk }
}
