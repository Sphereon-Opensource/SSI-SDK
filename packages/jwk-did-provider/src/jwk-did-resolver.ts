import { IParsedDID, parseDid } from '@sphereon/ssi-types'
import base64url from 'base64url'
import { DIDResolutionOptions, DIDResolutionResult, DIDResolver, JsonWebKey } from 'did-resolver'
import { KeyUse } from './types/jwk-provider-types';
// import * as jose from 'jose'

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

  // const rsaPublicKey = await jose.importJWK(
  //     {
  //       kty: 'RSA',
  //       e: 'AQAB',
  //       n: '12oBZRhCiZFJLcPg59LkZZ9mdhSMTKAQZYq32k_ti5SBB6jerkh-WzOMAO664r_qyLkqHUSp3u5SbXtseZEpN3XPWGKSxjsy-1JyEFTdLSYe6f9gfrmxkUF_7DTpq0gn6rntP05g2-wFW50YO7mosfdslfrTJYWHFhJALabAeYirYD7-9kqq9ebfFMF4sRRELbv9oi36As6Q9B3Qb5_C1rAzqfao_PCsf9EPsTZsVVVkA5qoIAr47lo1ipfiBPxUCCNSdvkmDTYgvvRm6ZoMjFbvOtgyts55fXKdMWv7I9HMD5HwE9uW839PWA514qhbcIsXEYSFMPMV6fnlsiZvQQ',
  //     },
  //     'PS256',
  // )
  // console.log(rsaPublicKey)
  // const secretKey = await jose.createSecretKey(process.env.JWT_SECRET, 'utf-8');
  // console.log(secretKey)
  //const yourBinaryDerKey = new Uint8Array(rsaPublicKey);
  // const xx = await jose.importJWK(jwk, "HS256", true)
  // console.log(xx)

  // TODO check if did (parse) is correct else return
  // TODO make 1 code block

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
          type: "JsonWebKey2020",
          controller: parsedDid.did,
          publicKeyJwk: jwk
        }
      ]
    },
    didDocumentMetadata: {}
  }

  if (jwk.use !== KeyUse.Encryption) {
    didResolution.didDocument!['assertionMethod'] = [`${parsedDid.did}#0`] // TODO ...(use && { use }),
    didResolution.didDocument!['authentication'] = [`${parsedDid.did}#0`]
    didResolution.didDocument!['capabilityInvocation'] = [`${parsedDid.did}#0`]
    didResolution.didDocument!['capabilityDelegation'] = [`${parsedDid.did}#0`]
  }

  if (!jwk.use || jwk.use === KeyUse.Encryption) {
    didResolution.didDocument!['keyAgreement'] = [`${parsedDid.did}#0`]
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
