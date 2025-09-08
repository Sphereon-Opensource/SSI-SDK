import { DIDDocument, DIDResolutionOptions } from 'did-resolver'
import { fetch } from 'cross-fetch'

export const EBSI_TEST_REGISTRY = 'https://api-test.ebsi.eu/did-registry/v5/identifiers'
export const EBSI_PILOT_REGISTRY_V5 = 'https://api-pilot.ebsi.eu/did-registry/v5'
export const EBSI_CONFORMANCE_REGISTRY_V5 = 'https://api-conformance.ebsi.eu/did-registry/v5/identifiers'

export const EBSI_PILOT_REGISTRY_V4 = 'https://api-pilot.ebsi.eu/did-registry/v4'
export const EBSI_CONFORMANCE_REGISTRY_V4 = 'https://api-conformance.ebsi.eu/did-registry/v4/identifiers'

type EBSIResolutionOptions = DIDResolutionOptions & {
  noFallbackRegistries?: boolean
  noEnvVarRegistry?: boolean
  registries?: string[]
  registry?: string
}
export const keyToDidDoc = async (did: string, contentType: string, options: EBSIResolutionOptions): Promise<DIDDocument> => {
  const registries = determineRegistries(options)
  for (const registry of registries) {
    try {
      const didDocument = await keyToDidDocImpl(did, contentType, registry, options)
      if (didDocument && !('error' in didDocument)) {
        return didDocument
      }
    } catch (error: unknown) {
      console.log(error)
    }
  }
  return Promise.reject(new Error(`Could not resolve DID ${did} using registries: ${JSON.stringify(registries)}`))
}

const keyToDidDocImpl = async (did: string, contentType: string, registry: string, options: DIDResolutionOptions): Promise<DIDDocument> => {
  const uri = didURI(did, registry)
  const response = await fetch(uri)
  if (response.status >= 400) {
    throw Error(await response.json())
  }
  return (await response.json()) as DIDDocument
}

const didURI = (did: string, registry: string) => {
  let uri = registry
  if (uri.endsWith('/')) {
    uri = uri.substring(0, uri.length - 1)
  }
  if (!uri.includes('identifiers')) {
    uri += '/identifiers'
  }
  return `${uri}/${did}`
}

const determineRegistries = (options: EBSIResolutionOptions): string[] => {
  let registries = new Set<string>()
  if (options.registries && Array.isArray(options.registries) && options.registries.length > 0) {
    options.registries.forEach(registries.add)
  }
  if (options.registry) {
    registries.add(options.registry)
  }
  if (options.noEnvVarRegistry !== true && process.env.EBSI_DEFAULT_REGISTRY) {
    registries.add(process.env.EBSI_DEFAULT_REGISTRY)
  }
  if (options.noFallbackRegistries !== true) {
    registries.add(EBSI_PILOT_REGISTRY_V5)
    registries.add(EBSI_CONFORMANCE_REGISTRY_V5)
    registries.add(EBSI_PILOT_REGISTRY_V4)
    registries.add(EBSI_CONFORMANCE_REGISTRY_V4)
    registries.add(EBSI_TEST_REGISTRY)
  }
  if (registries.size === 0) {
    throw Error('Please provide a registry as an option, a fallback registry or use an environment variable (EBSI_DEFAULT_REGISTRY)')
  }
  return Array.from(registries)
}

export default { keyToDidDoc }
