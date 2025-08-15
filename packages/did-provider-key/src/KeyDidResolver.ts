import { DIDResolutionOptions, DIDResolutionResult, DIDResolver, ParsedDID, Resolvable, Resolver } from 'did-resolver'
import { getResolver } from '@sphereon/ssi-sdk-ext.did-resolver-key'

const resolveDidKey: DIDResolver = async (
  didUrl: string,
  _parsed: ParsedDID,
  _resolver: Resolvable,
  options: DIDResolutionOptions
): Promise<DIDResolutionResult> => {
  const resolver = new Resolver({ ...getResolver() })
  return resolver.resolve(didUrl, options)
}

export function getDidKeyResolver() {
  return { key: resolveDidKey }
}
