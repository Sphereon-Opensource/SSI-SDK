import {
  IKeyValueStore,
  IValueData,
  KeyValueStore,
  ValueStoreType
} from '@sphereon/ssi-sdk.kv-store-temp'
import { IAgentPlugin } from '@veramo/core'
import fetch from 'cross-fetch'
import { GetResourceArgs, schema } from '../index'
import {
  ClearArgs,
  FetchArgs,
  IResourceResolver,
  NamespaceStrArgs,
  PersistResourceArgs,
  PrefixArgs,
  RequiredContext,
  ResourceResolverOptions,
  StoreArgs,
  StoreIdStrArgs
} from '../types/IResourceResolver'

// Exposing the methods here for any REST implementation
export const resourceResolverMethods: Array<string> = [
  'rrFetch',
  'rrGetResource',
  'rrPersistResource',
  'rrClearAllResources',
  'rrDefaultStoreId',
  'rrDefaultNamespace',
]

/**
 * {@inheritDoc IResourceResolver}
 */
export class ResourceResolver implements IAgentPlugin {
  readonly schema = schema.IContactManager
  readonly methods: IResourceResolver = {
    rrFetch: this.rrFetch.bind(this),
    rrGetResource: this.rrGetResource.bind(this),
    rrPersistResource: this.rrPersistResource.bind(this),
    rrClearAllResources: this.rrClearAllResources.bind(this),
    rrDefaultStoreId: this.rrDefaultStoreId.bind(this),
    rrDefaultNamespace: this.rrDefaultNamespace.bind(this),
  }

  private readonly defaultStoreId: string
  private readonly defaultNamespace: string
  private readonly defaultTtl: number
  private readonly _resourceStores: Map<string, IKeyValueStore<string>> //TODO type

  constructor(options?: ResourceResolverOptions) { // TODO check optionality
    const {
      defaultStore,
      defaultNamespace,
      resourceStores,
      ttl
    } = options ?? {}

    this.defaultStoreId = defaultStore ?? '_default'
    this.defaultNamespace = defaultNamespace ?? 'oid4vci'
    this.defaultTtl = ttl ?? 3600

    if (resourceStores && resourceStores instanceof Map) {
      this._resourceStores = resourceStores
    } else if (resourceStores) {
      this._resourceStores = new Map().set(this.defaultStoreId, resourceStores)
    } else {
      this._resourceStores = new Map().set(
        this.defaultStoreId,
        new KeyValueStore({
          namespace: this.defaultNamespace,
          store: new Map<string, string>() //TODO type
        })
      )
    }

    // TODO add option to import some predefined data
  }

  /** {@inheritDoc IResourceResolver.rrFetch} */
  private async rrFetch(args: FetchArgs, context: RequiredContext): Promise<Response> {
    const { input, init, ttl } = args

    console.log(`defaultStoreId: ${this.defaultStoreId}`)
    console.log(`defaultNamespace: ${this.defaultNamespace}`)
    console.log(`ttl: ${ttl}`)

    // TODO get resource or else fetch

    // TODO how are we going to handle error handling, we assume a response in the code, how are we going to handle that if we already have the resource

    return fetch(input, init)
  }

  /** {@inheritDoc IResourceResolver.rrPersistResource} */
  private async rrPersistResource(args: PersistResourceArgs): Promise<IValueData<string>> { // TODO string
    const { overwriteExisting, resource, ttl, resourceIdentifier } = args
    const namespace = this.namespaceStr(args)
    const storeId = this.storeIdStr(args)

    const existing = await this.store({ stores: this._resourceStores, storeId }).getAsValueData(
      this.prefix({
        namespace,
        resourceIdentifier: resourceIdentifier
      }),
    )

    if (!existing.value || (existing.value && overwriteExisting !== false)) {
      return await this.store({ stores: this._resourceStores, storeId }).set(
        this.prefix({
          namespace,
          resourceIdentifier: resourceIdentifier,
        }),
        resource,
        ttl ?? this.defaultTtl,
      )
    }

    return existing
  }

  /** {@inheritDoc IResourceResolver.rrGetResource} */
  private async rrGetResource(args: GetResourceArgs, context: RequiredContext): Promise<IValueData<string>> { // TODO correct type
    const { resourceIdentifier, storeId, namespace } = args
    return this.store({ stores: this._resourceStores, storeId }).getAsValueData(
      this.prefix({
        namespace,
        resourceIdentifier
      }),
    )
  }

  /** {@inheritDoc IResourceResolver.rrClearAllResources} */
  private async rrClearAllResources(args: ClearArgs): Promise<boolean> {
    const { storeId } = args
    return await this.store({ stores: this._resourceStores, storeId })
    .clear()
    .then(() => true)
  }

  /** {@inheritDoc IResourceResolver.rrDefaultStoreId} */
  private async rrDefaultStoreId(): Promise<string> {
    return this.defaultStoreId
  }

  /** {@inheritDoc IResourceResolver.rrDefaultNamespace} */
  private async rrDefaultNamespace(): Promise<string> {
    return this.defaultNamespace
  }

  private store<T extends ValueStoreType>(args: StoreArgs<T>): IKeyValueStore<T> {
    const storeId = this.storeIdStr({ storeId: args.storeId })
    const store = args.stores.get(storeId)
    if (!store) {
      throw Error(`Could not get resource store: ${storeId}`)
    }
    return store
  }

  private storeIdStr(args: StoreIdStrArgs): string {
    const { storeId } = args
    return storeId ?? this.defaultStoreId
  }

  private namespaceStr(args: NamespaceStrArgs): string {
    const { namespace } = args
    return namespace ?? this.defaultNamespace
  }

  private prefix(args: PrefixArgs): string {
    const { namespace, resourceIdentifier } = args
    return `${this.namespaceStr({ namespace })}:${resourceIdentifier}`
  }

}
