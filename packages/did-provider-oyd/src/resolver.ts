import type { DIDResolver } from 'did-resolver'
import { getResolver as getOydidResolver, type OydResolverConfig } from 'oydid-did-resolver'

/**
 * Provides a mapping to a did:oyd resolver, usable by {@link did-resolver#Resolver}.
 *
 * Resolution is delegated to `oydid-did-resolver`, the library maintained
 * alongside the did:oyd method itself. It reports failures as
 * `didResolutionMetadata.error` instead of throwing, tells a DID that does not
 * exist (`notFound`) apart from one that is malformed (`invalidDid`), and
 * reports a deactivated DID as `didDocumentMetadata.deactivated` per DID Core
 * 7.1.3 rather than as an error. It has no runtime dependencies of its own.
 *
 * @param config - base URL of an OYDID resolver, or a configuration object
 *   accepting `resolverUrl`, `path`, `timeout` and `headers`. Defaults to the
 *   public resolver at https://resolver.ownyourdata.eu.
 *
 * @public
 */
export function getDidOydResolver(config?: string | OydResolverConfig): Record<string, DIDResolver> {
  return getOydidResolver(config ?? {})
}
