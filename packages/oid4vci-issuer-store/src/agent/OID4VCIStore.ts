import { AuthorizationServerMetadata, IssuerMetadata } from '@sphereon/oid4vci-common'
import { IKeyValueStore, IValueData, KeyValueStore, ValueStoreType } from '@sphereon/ssi-sdk.kv-store-temp'
import { IAgentPlugin } from '@veramo/core'
import {
  IIssuerDefaultOpts,
  IIssuerMetadataImportArgs,
  IIssuerOptions,
  IIssuerOptsImportArgs,
  IIssuerOptsPersistArgs,
  IMetadataImportArgs,
  IMetadataPersistArgs,
  Ioid4vciStoreClearArgs,
  Ioid4vciStoreExistsArgs,
  IOid4vciStoreGetArgs,
  IOid4vciStoreListArgs,
  IOID4VCIStoreOpts,
  Ioid4vciStoreRemoveArgs,
  OptionalIssuerMetadata,
  OptionalIssuerMetadataValue,
} from '../index'

import { IOID4VCIStore } from '../types/IOID4VCIStore'

export const oid4vciStoreMethods: Array<string> = [
  'oid4vciStoreDefaultMetadata',
  'oid4vciStoreDefaultIssuerOptions',
  'oid4vciStoreDefaultStoreId',
  'oid4vciStoreDefaultNamespace',
  'oid4vciStoreGetIssuerOpts',
  'oid4vciStoreHasIssuerOpts',
  'oid4vciStorePersistIssuerOpts',
  'oid4vciStoreRemoveIssuerOpts',
  'oid4vciStoreClearAllIssuerOpts',
  'oid4vciStoreGetMetadata',
  'oid4vciStoreListMetadata',
  'oid4vciStoreHasMetadata',
  'oid4vciStorePersistMetadata',
  'oid4vciStoreRemoveMetadata',
  'oid4vciStoreClearAllMetadata',
]

// Type guard to check if value is a plain object (and not an array or null)
const isPlainObject = (value: unknown): value is Record<string, any> => typeof value === 'object' && value !== null && !Array.isArray(value)

export class OID4VCIStore implements IAgentPlugin {
  get defaultOpts(): IIssuerDefaultOpts | undefined {
    return this._defaultOpts
  }

  set defaultOpts(value: IIssuerDefaultOpts | undefined) {
    this._defaultOpts = value
  }

  private readonly _issuerMetadataStores: Map<string, IKeyValueStore<IssuerMetadata>>
  private readonly _authorizationServerMetadataStores: Map<string, IKeyValueStore<AuthorizationServerMetadata>>
  private readonly _optionStores: Map<string, IKeyValueStore<IIssuerOptions>>
  private readonly defaultStoreId: string
  private readonly defaultNamespace: string

  private _defaultOpts?: IIssuerDefaultOpts

  readonly methods: IOID4VCIStore = {
    oid4vciStoreDefaultMetadata: this.oid4vciStoreDefaultMetadata.bind(this),
    oid4vciStoreDefaultIssuerOptions: this.oid4vciStoreIssuerOptions.bind(this),
    oid4vciStoreDefaultStoreId: this.oid4vciStoreDefaultStoreId.bind(this),
    oid4vciStoreDefaultNamespace: this.oid4vciStoreDefaultNamespace.bind(this),

    oid4vciStoreGetIssuerOpts: this.oid4vciStoreGetIssuerOpts.bind(this),
    oid4vciStoreHasIssuerOpts: this.oid4vciStoreHasIssuerOpts.bind(this),
    oid4vciStorePersistIssuerOpts: this.oid4vciStorePersistIssuerOpts.bind(this),
    oid4vciStoreRemoveIssuerOpts: this.oid4vciStoreRemoveIssuerOpts.bind(this),
    oid4vciStoreClearAllIssuerOpts: this.oid4vciStoreClearAllIssuerOpts.bind(this),

    oid4vciStoreGetMetadata: this.oid4vciStoreGetMetadata.bind(this),
    oid4vciStoreListMetadata: this.oid4vciStoreListMetadata.bind(this),
    oid4vciStoreHasMetadata: this.oid4vciStoreHasMetadata.bind(this),
    oid4vciStorePersistMetadata: this.oid4vciStorePersistMetadata.bind(this),
    oid4vciStoreRemoveMetadata: this.oid4vciStoreRemoveMetadata.bind(this),
    oid4vciStoreClearAllMetadata: this.oid4vciStoreClearAllMetadata.bind(this),
  }

  constructor(opts: IOID4VCIStoreOpts) {
    this.defaultStoreId = opts.defaultStore ?? '_default'
    this.defaultNamespace = opts.defaultNamespace ?? 'oid4vci'
    if (opts.defaultOpts) {
      this._defaultOpts = opts.defaultOpts
    }
    if (opts?.issuerMetadataStores && opts.issuerMetadataStores instanceof Map) {
      this._issuerMetadataStores = opts.issuerMetadataStores
    } else if (opts?.issuerMetadataStores) {
      this._issuerMetadataStores = new Map().set(this.defaultStoreId, opts.issuerMetadataStores)
    } else {
      this._issuerMetadataStores = new Map().set(
        this.defaultStoreId,
        new KeyValueStore({
          namespace: this.defaultNamespace,
          store: new Map<string, IssuerMetadata>(),
        }),
      )
    }
    if (opts?.authorizationServerMetadataStores && opts.authorizationServerMetadataStores instanceof Map) {
      this._authorizationServerMetadataStores = opts.authorizationServerMetadataStores
    } else if (opts?.authorizationServerMetadataStores) {
      this._authorizationServerMetadataStores = new Map().set(this.defaultStoreId, opts.authorizationServerMetadataStores)
    } else {
      this._authorizationServerMetadataStores = new Map().set(
        this.defaultStoreId,
        new KeyValueStore({
          namespace: this.defaultNamespace,
          store: new Map<string, AuthorizationServerMetadata>(),
        }),
      )
    }

    if (opts && Array.isArray(opts?.importMetadatas)) {
      void this.importMetadatas(opts.importMetadatas)
    }

    if (opts?.issuerOptsStores && opts.issuerOptsStores instanceof Map) {
      this._optionStores = opts.issuerOptsStores
    } else if (opts?.issuerOptsStores) {
      this._optionStores = new Map().set(this.defaultStoreId, opts.issuerOptsStores)
    } else {
      this._optionStores = new Map().set(
        this.defaultStoreId,
        new KeyValueStore({
          namespace: this.defaultNamespace,
          store: new Map<string, IIssuerOptions>(),
        }),
      )
    }
    if (opts && Array.isArray(opts?.importIssuerOpts)) {
      opts.importIssuerOpts.forEach((opt) => this.oid4vciStorePersistIssuerOpts(opt))
    }
  }

  private async oid4vciStoreGetIssuerOpts({ correlationId, storeId, namespace }: IOid4vciStoreGetArgs): Promise<IIssuerOptions | undefined> {
    return (
      (await this.store({ stores: this._optionStores, storeId }).get(
        this.prefix({
          namespace,
          correlationId,
        }),
      )) ?? this.defaultOpts
    )
  }

  public importIssuerOpts(importOpts: IIssuerOptsImportArgs[]) {
    importOpts.forEach((opt) => this.oid4vciStorePersistIssuerOpts(opt))
  }

  private async importMetadatas(metadataImports: IMetadataImportArgs[]): Promise<void> {
    for (const metaImport of metadataImports) {
      const meta = metaImport as IIssuerMetadataImportArgs
      const storeId = meta.storeId ?? this.defaultStoreId
      const namespace = meta.namespace ?? this.defaultNamespace
      const correlationId = meta.correlationId

      const existingMetadata = await this.oid4vciStoreGetMetadata({
        metadataType: meta.metadataType,
        correlationId,
        storeId,
        namespace,
      })

      let metadataToPersist: IssuerMetadata | AuthorizationServerMetadata

      if (existingMetadata) {
        // If overwriteExisting is explicitly false, we skip this import if data exists
        if (meta.overwriteExisting === false) {
          continue
        }
        // Otherwise, we perform a deep merge.
        metadataToPersist = this.deepMerge(existingMetadata, meta.metadata)
      } else {
        metadataToPersist = meta.metadata
      }

      await this.oid4vciStorePersistMetadata({
        metadataType: meta.metadataType,
        metadata: metadataToPersist,
        storeId,
        correlationId,
        namespace,
        // We set this to true because we have already handled the merge/overwrite logic above.
        // We are now saving the final, combined object.
        overwriteExisting: true,
      })
    }
  }

  /**
   * Generic Deep Merge.
   * - Recursively merges objects.
   * - Overwrites primitives and arrays (Arrays are treated as values).
   * - Naturally handles 'credential_configurations_supported' by merging the keys of the map.
   */
  private deepMerge<T extends Record<string, any>>(existing: T, incoming: T): T {
    if (!incoming) {
      return existing
    }
    if (!existing) {
      return incoming
    }

    const merged = { ...existing }

    for (const key in incoming) {
      if (!Object.prototype.hasOwnProperty.call(incoming, key)) {
        continue
      }

      const incomingValue = incoming[key]
      const existingValue = existing[key]

      if (isPlainObject(incomingValue) && isPlainObject(existingValue)) {
        // Recursively merge objects
        merged[key] = this.deepMerge(existingValue, incomingValue) as T[Extract<keyof T, string>]
      } else if (incomingValue !== undefined) {
        // Overwrite primitives, arrays, or if existing value was undefined
        merged[key] = incomingValue
      }
    }

    return merged
  }

  private async oid4vciStoreHasIssuerOpts({ correlationId, storeId, namespace }: Ioid4vciStoreExistsArgs): Promise<boolean> {
    return this.store({ stores: this._optionStores, storeId }).has(this.prefix({ namespace, correlationId }))
  }

  private async oid4vciStorePersistIssuerOpts(args: IIssuerOptsPersistArgs): Promise<IValueData<IIssuerOptions>> {
    const storeId = this.storeIdStr(args)
    const namespace = this.namespaceStr(args)
    const { correlationId, issuerOpts, ttl } = args
    if (args?.validation !== false) {
      //todo
    }
    const existing = await this.store({ stores: this._optionStores, storeId }).getAsValueData(
      this.prefix({
        namespace,
        correlationId,
      }),
    )
    if (!existing.value || (existing.value && args.overwriteExisting !== false)) {
      return await this.store({ stores: this._optionStores, storeId }).set(
        this.prefix({
          namespace,
          correlationId,
        }),
        issuerOpts,
        ttl,
      )
    }
    return existing
  }

  private async oid4vciStoreRemoveIssuerOpts({ storeId, correlationId, namespace }: Ioid4vciStoreRemoveArgs): Promise<boolean> {
    return this.store({ stores: this._optionStores, storeId }).delete(this.prefix({ namespace, correlationId }))
  }

  private async oid4vciStoreClearAllIssuerOpts({ storeId }: Ioid4vciStoreClearArgs): Promise<boolean> {
    return await this.store({ stores: this._optionStores, storeId })
      .clear()
      .then(() => true)
  }

  private async oid4vciStoreGetMetadata({
    metadataType,
    correlationId,
    storeId,
    namespace,
  }: IOid4vciStoreGetArgs): Promise<IssuerMetadata | AuthorizationServerMetadata | undefined> {
    switch (metadataType) {
      case 'authorizationServer':
        return this.store<AuthorizationServerMetadata>({
          stores: this._authorizationServerMetadataStores,
          storeId,
        }).get(this.prefix({ namespace, correlationId }))
      case 'issuer':
        return this.store<IssuerMetadata>({
          stores: this._issuerMetadataStores,
          storeId,
        }).get(this.prefix({ namespace, correlationId }))
    }
    return undefined
  }

  private async oid4vciStoreListMetadata({ metadataType, storeId, namespace }: IOid4vciStoreListArgs): Promise<Array<OptionalIssuerMetadata>> {
    switch (metadataType) {
      case 'authorizationServer':
        return this.store<AuthorizationServerMetadata>({
          stores: this._authorizationServerMetadataStores,
          storeId,
        }).getMany([`${this.namespaceStr({ namespace })}`])
      case 'issuer':
        return this.store<IssuerMetadata>({
          stores: this._issuerMetadataStores,
          storeId,
        }).getMany([`${this.namespaceStr({ namespace })}`])
    }
    return []
  }

  private async oid4vciStoreHasMetadata({ metadataType, correlationId, storeId, namespace }: Ioid4vciStoreExistsArgs): Promise<boolean> {
    switch (metadataType) {
      case 'authorizationServer':
        return this.store<AuthorizationServerMetadata>({
          stores: this._authorizationServerMetadataStores,
          storeId,
        }).has(this.prefix({ namespace, correlationId }))
      case 'issuer':
        return this.store<IssuerMetadata>({
          stores: this._issuerMetadataStores,
          storeId,
        }).has(this.prefix({ namespace, correlationId }))
    }
    return false
  }

  private async oid4vciStorePersistMetadata(args: IMetadataPersistArgs): Promise<OptionalIssuerMetadataValue> {
    const namespace = this.namespaceStr(args)
    const storeId = this.storeIdStr(args)
    const { correlationId, metadata, ttl, metadataType } = args

    if (args?.validation !== false) {
      //todo
    }

    switch (metadataType) {
      case 'authorizationServer':
        const existingAuth = await this.store<AuthorizationServerMetadata>({
          stores: this._authorizationServerMetadataStores,
          storeId,
        }).getAsValueData(this.prefix({ namespace, correlationId }))

        if (!existingAuth.value || (existingAuth.value && args.overwriteExisting !== false)) {
          return await this.store<AuthorizationServerMetadata>({
            stores: this._authorizationServerMetadataStores,
            storeId,
          }).set(this.prefix({ namespace, correlationId }), metadata as AuthorizationServerMetadata, ttl)
        }
        return existingAuth
      case 'issuer':
        const existingIssuer = await this.store<IssuerMetadata>({
          stores: this._issuerMetadataStores,
          storeId,
        }).getAsValueData(this.prefix({ namespace, correlationId }))

        if (!existingIssuer.value || (existingIssuer.value && args.overwriteExisting !== false)) {
          return await this.store<IssuerMetadata>({
            stores: this._issuerMetadataStores,
            storeId,
          }).set(this.prefix({ namespace, correlationId }), metadata as IssuerMetadata, ttl)
        }
        return existingIssuer
    }
    return undefined
  }

  private async oid4vciStoreRemoveMetadata(args: Ioid4vciStoreRemoveArgs): Promise<boolean> {
    const namespace = this.namespaceStr(args)
    const storeId = this.storeIdStr(args)

    switch (args.metadataType) {
      case 'authorizationServer':
        return this.store<AuthorizationServerMetadata>({
          stores: this._authorizationServerMetadataStores,
          storeId,
        }).delete(this.prefix({ namespace, correlationId: args.correlationId }))
      case 'issuer':
        return this.store<IssuerMetadata>({
          stores: this._issuerMetadataStores,
          storeId,
        }).delete(this.prefix({ namespace, correlationId: args.correlationId }))
    }
    return false
  }

  private async oid4vciStoreClearAllMetadata({ metadataType, storeId }: Ioid4vciStoreClearArgs): Promise<boolean> {
    switch (metadataType) {
      case 'authorizationServer':
        return await this.store<AuthorizationServerMetadata>({
          stores: this._authorizationServerMetadataStores,
          storeId,
        })
          .clear()
          .then(() => true)
      case 'issuer':
        return await this.store<IssuerMetadata>({
          stores: this._issuerMetadataStores,
          storeId,
        })
          .clear()
          .then(() => true)
    }
    return false
  }

  private oid4vciStoreIssuerOptions(): Promise<IKeyValueStore<IIssuerOptions>> {
    return Promise.resolve(this.store({ stores: this._optionStores, storeId: this.defaultStoreId }))
  }

  private oid4vciStoreDefaultMetadata(): Promise<IKeyValueStore<IssuerMetadata>> {
    return Promise.resolve(this.store({ stores: this._issuerMetadataStores, storeId: this.defaultStoreId }))
  }

  private oid4vciStoreDefaultStoreId(): Promise<string> {
    return Promise.resolve(this.defaultStoreId)
  }

  private oid4vciStoreDefaultNamespace(): Promise<string> {
    return Promise.resolve(this.defaultNamespace)
  }

  private store<T extends ValueStoreType>(args: { stores: Map<string, IKeyValueStore<T>>; storeId?: string }): IKeyValueStore<T> {
    const storeId = this.storeIdStr({ storeId: args.storeId })
    const store = args.stores.get(storeId)
    if (!store) {
      throw Error(`Could not get issuer metadata store: ${storeId}`)
    }
    return store
  }

  private storeIdStr({ storeId }: { storeId?: string }): string {
    return storeId ?? this.defaultStoreId
  }

  private namespaceStr({ namespace }: { namespace?: string }): string {
    return namespace ?? this.defaultNamespace
  }

  private prefix({ namespace, correlationId }: { namespace?: string; correlationId: string }): string {
    return `${this.namespaceStr({ namespace })}:${correlationId}`
  }
}
