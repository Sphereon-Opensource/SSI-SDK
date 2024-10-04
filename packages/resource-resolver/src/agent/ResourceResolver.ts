import {
  IKeyValueStore,
  IValueData,
  KeyValueStore,
  ValueStoreType
} from '@sphereon/ssi-sdk.kv-store-temp'
import { IAgentPlugin } from '@veramo/core'
import fetch, { Response, Headers } from 'cross-fetch'
import { schema } from '../index'
import {
  deserializeResponse,
  getResourceIdentifier,
  serializeResponse
} from '../utils/ResourceResolverUtils'
import {
  ClearArgs,
  ResolveArgs,
  GetResourceArgs,
  IResourceResolver,
  NamespaceStrArgs,
  PersistResourceArgs,
  PrefixArgs,
  RequiredContext,
  ResourceResolverOptions,
  StoreArgs,
  StoreIdStrArgs,
  Resource
} from '../types/IResourceResolver'

/**
 * {@inheritDoc IResourceResolver}
 */
export class ResourceResolver implements IAgentPlugin {
  readonly schema = schema.IResourceResolver
  readonly methods: IResourceResolver = {
    resourceResolve: this.resourceResolve.bind(this),
    resourceClearAllResources: this.resourceClearAllResources.bind(this),
    resourceDefaultStoreId: this.resourceDefaultStoreId.bind(this),
    resourceDefaultNamespace: this.resourceDefaultNamespace.bind(this),
    resourceDefaultTtl: this.resourceDefaultTtl.bind(this),
  }

  private readonly defaultStoreId: string
  private readonly defaultNamespace: string
  private readonly defaultTtl: number
  private readonly _resourceStores: Map<string, IKeyValueStore<Resource>>

  constructor(options?: ResourceResolverOptions) {
    const {
      defaultStore,
      defaultNamespace,
      resourceStores,
      ttl
    } = options ?? {}

    this.defaultStoreId = defaultStore ?? '_default'
    this.defaultNamespace = defaultNamespace ?? 'resources'
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
          store: new Map<string, Resource>(),
          ttl: this.defaultTtl
        })
      )
    }
  }

  /** {@inheritDoc IResourceResolver.resourceResolve} */
  private async resourceResolve(args: ResolveArgs, context: RequiredContext): Promise<Response> {
    const {
      input,
      init,
      resourceType,
      resolveOpts,
      partyCorrelationId,
      storeId,
      namespace
    } = args

    const resourceIdentifier = getResourceIdentifier(input)

    const cachedResource = await this.getResource({ resourceIdentifier, storeId, namespace })
    if (cachedResource.value && (resolveOpts?.maxAgeMs === undefined || (Date.now() - cachedResource.value.insertedAt < resolveOpts.maxAgeMs))) {
      return deserializeResponse(cachedResource.value.response);
    }

    if (resolveOpts?.onlyCache) {
      return new Response(JSON.stringify({ error: 'Resource not found' }), {
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({ 'Content-Type': 'application/json' })
      });
    }

    const response = await fetch(input, init)
    if (!resolveOpts?.skipPersistence && (response.status >= 200 && response.status < 300)) {
      const serializedResponse = await serializeResponse(response);
      const resource = {
        response: serializedResponse,
        resourceType,
        insertedAt: Date.now(),
        partyCorrelationId
      }
      const cachedResource = await this.persistResource({
        resource,
        resourceIdentifier,
        namespace,
        storeId
      })

      if (!cachedResource.value) {
        return Promise.reject(Error('Resource not present in persistence result'))
      }

      return deserializeResponse(cachedResource.value.response)
    }

    return response
  }

  /** {@inheritDoc IResourceResolver.resourceClearAllResources} */
  private async resourceClearAllResources(args: ClearArgs, context: RequiredContext): Promise<boolean> {
    const { storeId } = args
    return await this.store({ stores: this._resourceStores, storeId })
      .clear()
      .then(() => true)
  }

  /** {@inheritDoc IResourceResolver.resourceDefaultStoreId} */
  private async resourceDefaultStoreId(context: RequiredContext): Promise<string> {
    return this.defaultStoreId
  }

  /** {@inheritDoc IResourceResolver.resourceDefaultNamespace} */
  private async resourceDefaultNamespace(context: RequiredContext): Promise<string> {
    return this.defaultNamespace
  }

  /** {@inheritDoc IResourceResolver.resourceDefaultTtl} */
  private async resourceDefaultTtl(context: RequiredContext): Promise<number> {
    return this.defaultTtl
  }

  private async getResource(args: GetResourceArgs): Promise<IValueData<Resource>> {
    const { resourceIdentifier, storeId, namespace } = args
    return this.store({ stores: this._resourceStores, storeId }).getAsValueData(
      this.prefix({
        namespace,
        resourceIdentifier
      }),
    )
  }

  private async persistResource(args: PersistResourceArgs): Promise<IValueData<Resource>> {
    const { resource, resourceIdentifier, ttl } = args
    const namespace = this.namespaceStr(args)
    const storeId = this.storeIdStr(args)

    return await this.store({ stores: this._resourceStores, storeId }).set(
      this.prefix({
        namespace,
        resourceIdentifier,
      }),
      resource,
      ttl ?? this.defaultTtl,
    )
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

