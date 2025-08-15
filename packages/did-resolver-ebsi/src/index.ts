import * as ebsiV1 from './drivers/ebsi-v1'
import { DIDResolutionOptions, DIDResolutionResult, ParsedDID, Resolvable, ResolverRegistry } from 'did-resolver'

import { config } from 'dotenv'

config()
export const DID_LD_JSON = 'application/did+ld+json'
export const DID_JSON = 'application/did+json'
const methodToDriverMap: any = {
  ebsi: ebsiV1,
}

export const getResolver = (): ResolverRegistry => {
  return {
    ebsi: async (did: string, parsed: ParsedDID, r: Resolvable, options: DIDResolutionOptions) => {
      const response: DIDResolutionResult = {
        didResolutionMetadata: {},
        didDocument: null,
        didDocumentMetadata: {},
      }

      try {
        const contentType = determineContentType(options)
        response.didResolutionMetadata.contentType = contentType
        const driver = methodToDriverMap[parsed.method]
        const doc = await driver.keyToDidDoc(did, contentType, options)
        switch (contentType) {
          case DID_LD_JSON:
            if (!doc['@context']) {
              doc['@context'] = 'https://w3id.org/did/v1'
            } else if (
              Array.isArray(doc['@context']) &&
              !doc['@context'].includes('https://w3id.org/did/v1') &&
              !doc['@context'].includes('https://www.w3.org/ns/did/v1')
            ) {
              doc['@context'].push('https://w3id.org/did/v1')
            }
            response.didDocument = doc
            break
          case DID_JSON:
            response.didDocument = doc
            break
          default:
            delete response.didResolutionMetadata.contentType
            response.didResolutionMetadata.error = 'representationNotSupported'
            break
        }
      } catch (e: any) {
        response.didResolutionMetadata.error = 'invalidDid'
        response.didResolutionMetadata.message = e.toString()
      }
      return response
    },
  }
}

const determineContentType = (options: DIDResolutionOptions): string => {
  const contentType = options.accept || DID_JSON
  if (contentType !== DID_JSON && contentType !== DID_LD_JSON) {
    throw Error(`Only ${DID_JSON} and ${DID_LD_JSON} are supported. Provided: ${contentType}`)
  }
  return contentType
}
export default { getResolver }
