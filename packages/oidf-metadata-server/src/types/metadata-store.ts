import { IPluginMethodMap } from '@veramo/core'
import { IKeyValueStore, IValueData } from '@sphereon/ssi-sdk.kv-store-temp'
import { IMetadataImportArgs } from '@sphereon/ssi-types'

export type OpenidFederationMetadata = {
  baseUrl: string
  jwt: string
  enabled: boolean | undefined
}

export type OptionalOpenidFederationMetadata = OpenidFederationMetadata | undefined
export type OpenidFederationValueData = IValueData<OpenidFederationMetadata>
export type OptionalOpenidFederationValueData = IValueData<OpenidFederationMetadata> | undefined

export interface IOIDFMetadataStore extends IPluginMethodMap {
  oidfStoreGetMetadata({ correlationId, storeId, namespace }: IFederationMetadataGetArgs): Promise<OptionalOpenidFederationMetadata>

  oidfStoreListMetadata({ storeId, namespace }: IFederationMetadataListArgs): Promise<Array<OpenidFederationMetadata>>

  oidfStoreHasMetadata({ correlationId, storeId, namespace }: FederationMetadataExistsArgs): Promise<boolean>

  oidfStorePersistMetadata(args: IFederationMetadataPersistArgs): Promise<OptionalOpenidFederationValueData>

  oidfStoreImportMetadatas(args: Array<IMetadataImportArgs>): Promise<boolean>

  oidfStoreRemoveMetadata({ storeId, correlationId, namespace }: FederationMetadataRemoveArgs): Promise<boolean>

  oidfStoreClearAllMetadata({ storeId }: IFederationMetadataClearArgs): Promise<boolean>
}

export interface IFederationMetadataStoreOpts {
  defaultStoreId?: string
  defaultNamespace?: string
  openidFederationMetadataStores?: Map<string, IKeyValueStore<OpenidFederationMetadata>> | IKeyValueStore<OpenidFederationMetadata>
}

export interface IFederationMetadataPersistArgs extends IMetadataImportArgs {
  correlationId: string
  metadata: OpenidFederationMetadata
  overwriteExisting?: boolean
  validation?: boolean
  ttl?: number
  storeId?: string
  namespace?: string
}

export type FederationMetadataImportArgs = IFederationMetadataPersistArgs

export interface IFederationMetadataListArgs {
  storeId?: string
  namespace?: string
}

export interface IFederationMetadataGetArgs extends IFederationMetadataListArgs {
  correlationId: string
}

export type FederationMetadataExistsArgs = IFederationMetadataGetArgs
export type FederationMetadataRemoveArgs = IFederationMetadataGetArgs

export interface IFederationMetadataClearArgs {
  storeId?: string
}
