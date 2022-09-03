import varint from 'varint'
import multibase from 'multibase'
import ed25519 from './ed25519'
import bls12381g2 from './bls12381g2'
import secp256k1 from './secp256k1'
import { ParsedDID, Resolvable, DIDResolutionOptions, DIDResolutionResult, ResolverRegistry } from 'did-resolver'

const DID_LD_JSON = 'application/did+ld+json'
const DID_JSON = 'application/did+json'
const prefixToDriverMap: any = {
  0xe7: secp256k1,
  0xed: ed25519,
  0xeb: bls12381g2,
}

export const getResolver = (): ResolverRegistry => {
  return {
    key: async (did: string, parsed: ParsedDID, r: Resolvable, options: DIDResolutionOptions) => {
      const contentType = options.accept || DID_JSON
      const response: DIDResolutionResult = {
        didResolutionMetadata: { contentType },
        didDocument: null,
        didDocumentMetadata: {},
      }
      try {
        const multicodecPubKey = multibase.decode(parsed.id)
        const keyType = varint.decode(multicodecPubKey)
        const pubKeyBytes = multicodecPubKey.slice(varint.decode.bytes)
        const doc = await prefixToDriverMap[keyType].keyToDidDoc(pubKeyBytes, parsed.id)
        if (contentType === DID_LD_JSON) {
          doc['@context'] = 'https://w3id.org/did/v1'
          response.didDocument = doc
        } else if (contentType === DID_JSON) {
          response.didDocument = doc
        } else {
          delete response.didResolutionMetadata.contentType
          response.didResolutionMetadata.error = 'representationNotSupported'
        }
      } catch (e: any) {
        response.didResolutionMetadata.error = 'invalidDid'
        response.didResolutionMetadata.message = e.toString()
      }
      return response
    },
  }
}
export default { getResolver }
