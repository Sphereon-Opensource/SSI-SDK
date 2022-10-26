import { IParsedDID, parseDid } from '@sphereon/ssi-types'
import base64url from 'base64url'
import { DIDResolutionOptions, DIDResolutionResult, DIDResolver, JsonWebKey } from 'did-resolver'
import {
  ContextType,
  KeyUse,
  VerificationType,
  VocabType
} from './types/jwk-provider-types'

export const resolveDidJwk: DIDResolver = async (didUrl: string, options?: DIDResolutionOptions): Promise<DIDResolutionResult> => {
  return resolve(didUrl, options)
}

const resolve = async (didUrl: string, options?: DIDResolutionOptions): Promise<DIDResolutionResult> => {
  let parsedDid: IParsedDID
  try {
    parsedDid = parseDid(didUrl)
  } catch (error: unknown) {
    return errorResponseFrom('invalidDid')
  }

  if (parsedDid.method !== 'jwk') {
    return errorResponseFrom('unsupportedDidMethod')
  }

  let jwk: JsonWebKey
  try {
    jwk = JSON.parse(base64url.decode(parsedDid.id, 'UTF-8'))
  } catch (error: unknown) {
    return errorResponseFrom('invalidDid')
  }

  // We need this since DIDResolutionResult does not allow for an object in the array
  const context = [ ContextType.DidDocument, { '@vocab': VocabType.Jose } ] as never

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
          id: '#0',
          type: VerificationType.JsonWebKey2020,
          controller: parsedDid.did,
          publicKeyJwk: jwk,
        },
      ],
      ...((jwk.use && jwk.use !== KeyUse.Encryption || jwk.alg) && { assertionMethod: ['#0'] }),
      ...((jwk.use && jwk.use !== KeyUse.Encryption || jwk.alg) && { authentication: ['#0'] }),
      ...((jwk.use && jwk.use !== KeyUse.Encryption || jwk.alg) && { capabilityInvocation: ['#0'] }),
      ...((jwk.use && jwk.use !== KeyUse.Encryption || jwk.alg) && { capabilityDelegation: ['#0'] }),
      ...(jwk.use && jwk.use === KeyUse.Encryption && { keyAgreement: ['#0'] }),
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
