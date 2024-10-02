import { IKeyValueStore, IValueData, ValueStoreType } from '@sphereon/ssi-sdk.kv-store-temp'
import { IAgentContext, IPluginMethodMap } from '@veramo/core'

export interface IResourceResolver extends IPluginMethodMap {
  rrFetch(args: FetchArgs, context: RequiredContext): Promise<Response>
  rrGetResource(args: GetResourceArgs, context: RequiredContext): Promise<IValueData<string>> // TODO string to correct type
  rrPersistResource(args: PersistResourceArgs, context: RequiredContext): Promise<IValueData<string>> // TODO string to correct type
  rrClearAllResources(args: ClearArgs): Promise<boolean>
  rrDefaultStoreId(): Promise<string>
  rrDefaultNamespace(): Promise<string>
}

export type ResourceResolverOptions = {
  defaultStore?: string
  defaultNamespace?: string
  resourceStores?: Map<string, IKeyValueStore<string>> | IKeyValueStore<string> //IssuerMetadata
  ttl?: number
}

export type FetchArgs = {
  input: RequestInfo | URL
  init?: RequestInit
  ttl?: number
}

export type ClearArgs = {
  storeId?: string
}

export type PersistResourceArgs = {
  resource: any // TODO any
  resourceIdentifier: string // TODO uri? or resourceIdentifier // url? fetch is always based on a url?
  overwriteExisting?: boolean
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
  namespace?: string;
  resourceIdentifier: string // TODO uri? or resourceIdentifier // url? fetch is always based on a url?
}

export type StoreArgs<T extends ValueStoreType> = {
  stores: Map<string, IKeyValueStore<T>>
  storeId?: string
}

export type RequiredContext = IAgentContext<never>
