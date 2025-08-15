import varint from 'varint'
const { decode } = varint
// @ts-ignore
import { base58btc } from 'multiformats/bases/base58'
import ed25519 from './drivers/ed25519'
import bls12381g2 from './drivers/bls12381g2'
import secp256k1 from './drivers/secp256k1'
import secp256r1 from './drivers/secp256r1'
import secp384r1 from './drivers/secp384r1'
import secp521r1 from './drivers/secp521r1'
import { DIDResolutionResult, ParsedDID, Resolvable, ResolverRegistry } from 'did-resolver'
import jwkJcs from './drivers/jwk.jcs'
import { DID_JSON, DID_LD_JSON, DIDKeyResolutionOptions, KeyToDidDocArgs } from './types'

export * from './types'

const prefixToDriverMap: any = {
  0xe7: secp256k1,
  0xed: ed25519,
  0x1200: secp256r1,
  0x1201: secp384r1,
  0x1202: secp521r1,
  0xeb: bls12381g2,
  0xeb51: jwkJcs,
}

export const getResolver = (): ResolverRegistry => {
  return {
    key: async (did: string, parsed: ParsedDID, r: Resolvable, options: DIDKeyResolutionOptions) => {
      const contentType = options.accept || DID_LD_JSON
      const response: DIDResolutionResult = {
        didResolutionMetadata: { contentType },
        didDocument: null,
        didDocumentMetadata: {},
      }
      try {
        const multicodecPubKey = base58btc.decode(parsed.id)
        const keyType = decode(multicodecPubKey)
        const pubKeyBytes = multicodecPubKey.slice(decode.bytes)
        const args: KeyToDidDocArgs = { pubKeyBytes, fingerprint: parsed.id, contentType, options }
        const doc = await prefixToDriverMap[keyType].keyToDidDoc(args)
        if (contentType === DID_LD_JSON) {
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
