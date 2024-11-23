import { IKeyValueStore, ValueStoreType } from '@sphereon/ssi-sdk.kv-store-temp'
import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { IAnomalyDetection } from '@sphereon/ssi-sdk.anomaly-detection'

export interface IResourceResolver extends IPluginMethodMap {
  resourceResolve(args: ResolveArgs, context: RequiredContext): Promise<Response>
  resourceClearAllResources(args: ClearAllResourcesArgs, context: RequiredContext): Promise<boolean>
  resourceDefaultStoreId(context: RequiredContext): Promise<string>
  resourceDefaultNamespace(context: RequiredContext): Promise<string>
  resourceDefaultTtl(context: RequiredContext): Promise<number>
}

export type ResourceResolverOptions = {
  defaultStore?: string
  defaultNamespace?: string
  resourceStores?: Map<string, IKeyValueStore<Resource>> | IKeyValueStore<Resource>
  ttl?: number
  detectLocation?: boolean
}

export type ResolveArgs = {
  input: RequestInfo | URL
  init?: RequestInit
  resourceType: ResourceType
  partyCorrelationId?: string
  storeId?: string
  namespace?: string
  resolveOpts?: ResolveOptions
}

export type ResolveOptions = {
  ttl?: number
  maxAgeMs?: number
  onlyCache?: boolean
  skipPersistence?: boolean
}

export type ResourceType = 'credential_branding_image' | 'issuer_branding_image' | 'oid4vci_metadata' | string

export type ClearAllResourcesArgs = {
  storeId?: string
}

export type PersistResourceArgs = {
  resource: Resource
  resourceIdentifier: string
  ttl?: number
  storeId?: string
  namespace?: string
}

export type GetResourceArgs = {
  resourceIdentifier: string
  storeId?: string
  namespace?: string
}

export type StoreIdStrArgs = {
  storeId?: string
}

export type NamespaceStrArgs = {
  namespace?: string
}

export type PrefixArgs = {
  namespace?: string
  resourceIdentifier: string
}

export type StoreArgs<T extends ValueStoreType> = {
  stores: Map<string, IKeyValueStore<T>>
  storeId?: string
}

export type Location = {
  continent?: string
  country?: string
}

export type Resource = {
  location?: Location | null
  response: SerializedResponse
  resourceType: ResourceType
  insertedAt: number
  partyCorrelationId?: string
}

export type SerializedResponse = {
  status: number
  statusText: string
  headers: { [x: string]: string }
  body: string
}

export type RequiredContext = IAgentContext<IAnomalyDetection>
