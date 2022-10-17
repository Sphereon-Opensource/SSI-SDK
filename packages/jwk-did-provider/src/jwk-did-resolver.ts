import { IParsedDID, parseDid } from '@sphereon/ssi-types'
import base64url from 'base64url'
import { DIDResolutionOptions, DIDResolutionResult, DIDResolver, JsonWebKey } from 'did-resolver'
import { KeyUse, VerificationType } from './types/jwk-provider-types';

export const resolveDidJwk: DIDResolver = async (didUrl: string, options?: DIDResolutionOptions): Promise<DIDResolutionResult> => {
  return resolve(didUrl, options)
}

const resolve = async (didUrl: string, options?: DIDResolutionOptions) => {
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

  const didResolution: DIDResolutionResult = {
    didResolutionMetadata: {
      contentType: 'application/did+ld+json',
      pattern: '^(did:jwk:.+)$',
      did: {
        didString: parsedDid.did,
        methodSpecificId: parsedDid.id,
        method: 'jwk'
      }
    },
    didDocument: {
      "@context": [
        "https://www.w3.org/ns/did/v1",
        "https://w3id.org/security/suites/jws-2020/v1"
      ],
      id: parsedDid.did,
      verificationMethod: [
        {
          id: '#0',
          type: VerificationType.JsonWebKey2020,
          controller: parsedDid.did,
          publicKeyJwk: jwk
        }
      ],
      ...(jwk.use !== KeyUse.Encryption && { assertionMethod: [`${parsedDid.did}#0`] }),
      ...(jwk.use !== KeyUse.Encryption && { authentication: [`${parsedDid.did}#0`] }),
      ...(jwk.use !== KeyUse.Encryption && { capabilityInvocation: [`${parsedDid.did}#0`] }),
      ...(jwk.use !== KeyUse.Encryption && { capabilityDelegation: [`${parsedDid.did}#0`] }),
      ...((!jwk.use || jwk.use === KeyUse.Encryption) && { keyAgreement: [`${parsedDid.did}#0`] }),
    },
    didDocumentMetadata: {}
  }

  return didResolution
}

const errorResponseFrom = async (error: string) => {
  return {
    didResolutionMetadata: {
      error
    },
    didDocument: null,
    didDocumentMetadata: {}
  }
}

export function getDidJwkResolver() {
  return { jwk: resolveDidJwk }
}
