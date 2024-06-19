import { IssuerMetadata } from '@sphereon/oid4vci-common'
import { IKeyValueStore, IValueData, KeyValueStore, ValueStoreType } from '@sphereon/ssi-sdk.kv-store-temp'
import { IAgentPlugin } from '@veramo/core'
import {
  IIssuerDefaultOpts,
  IIssuerOptions,
  IIssuerOptsImportArgs,
  IIssuerOptsPersistArgs,
  IMetadataPersistArgs,
  Ioid4vciStoreClearArgs,
  Ioid4vciStoreExistsArgs,
  Ioid4vciStoreGetArgs,
  IOID4VCIStoreOpts,
  Ioid4vciStoreRemoveArgs,
} from '../index'

import { IOID4VCIStore } from '../types/IOID4VCIStore'

export class OID4VCIStore implements IAgentPlugin {
  get defaultOpts(): IIssuerDefaultOpts | undefined {
    return this._defaultOpts
  }

  set defaultOpts(value: IIssuerDefaultOpts | undefined) {
    this._defaultOpts = value
  }

  private readonly _metadataStores: Map<string, IKeyValueStore<IssuerMetadata>>
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
    if (opts?.metadataStores && opts.metadataStores instanceof Map) {
      this._metadataStores = opts.metadataStores
    } else if (opts?.metadataStores) {
      this._metadataStores = new Map().set(this.defaultStoreId, opts.metadataStores)
    } else {
      this._metadataStores = new Map().set(
        this.defaultStoreId,
        new KeyValueStore({
          namespace: this.defaultNamespace,
          store: new Map<string, IssuerMetadata>(),
        }),
      )
    }
    if (opts && Array.isArray(opts?.importMetadatas)) {
      opts.importMetadatas.forEach((meta) =>
        this.oid4vciStorePersistMetadata({
          metadata: meta.metadata,
          storeId: meta.storeId ?? this.defaultStoreId,
          correlationId: meta.correlationId,
          namespace: meta.namespace ?? this.defaultNamespace,
          overwriteExisting: meta.overwriteExisting === undefined ? true : meta.overwriteExisting,
        }),
      )
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

  private async oid4vciStoreGetIssuerOpts({ correlationId, storeId, namespace }: Ioid4vciStoreGetArgs): Promise<IIssuerOptions | undefined> {
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

  private async oid4vciStoreGetMetadata({ correlationId, storeId, namespace }: Ioid4vciStoreGetArgs): Promise<IssuerMetadata | undefined> {
    return this.store({ stores: this._metadataStores, storeId }).get(this.prefix({ namespace, correlationId }))
  }

  private async oid4vciStoreHasMetadata({ correlationId, storeId, namespace }: Ioid4vciStoreExistsArgs): Promise<boolean> {
    return this.store({ stores: this._metadataStores, storeId }).has(this.prefix({ namespace, correlationId }))
  }

  private async oid4vciStorePersistMetadata(args: IMetadataPersistArgs): Promise<IValueData<IssuerMetadata>> {
    const namespace = this.namespaceStr(args)
    const storeId = this.storeIdStr(args)
    const { correlationId, metadata, ttl } = args
    if (args?.validation !== false) {
      //todo
    }
    const existing = await this.store({
      stores: this._metadataStores,
      storeId,
    }).getAsValueData(this.prefix({ namespace, correlationId: correlationId }))
    if (!existing.value || (existing.value && args.overwriteExisting !== false)) {
      // fixme: cast to issuer metadata
      return await this.store({ stores: this._metadataStores, storeId }).set(
        this.prefix({
          namespace,
          correlationId: correlationId,
        }),
        metadata as IssuerMetadata,
        ttl,
      )
    }
    return existing
  }

  private async oid4vciStoreRemoveMetadata(args: Ioid4vciStoreRemoveArgs): Promise<boolean> {
    const namespace = this.namespaceStr(args)
    const storeId = this.storeIdStr(args)
    return this.store({ stores: this._metadataStores, storeId }).delete(
      this.prefix({
        namespace,
        correlationId: args.correlationId,
      }),
    )
  }

  private async oid4vciStoreClearAllMetadata({ storeId }: Ioid4vciStoreClearArgs): Promise<boolean> {
    return await this.store({ stores: this._metadataStores, storeId })
      .clear()
      .then(() => true)
  }

  private oid4vciStoreIssuerOptions(): Promise<IKeyValueStore<IIssuerOptions>> {
    return Promise.resolve(this.store({ stores: this._optionStores, storeId: this.defaultStoreId }))
  }

  private oid4vciStoreDefaultMetadata(): Promise<IKeyValueStore<IssuerMetadata>> {
    return Promise.resolve(this.store({ stores: this._metadataStores, storeId: this.defaultStoreId }))
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

  private prefix({ namespace, correlationId }: { namespace?: string; correlationId: string }) {
    return `${this.namespaceStr({ namespace })}:${correlationId}`
  }
}
