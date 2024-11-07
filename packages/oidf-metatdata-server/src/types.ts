import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { IFederationMetadata } from '@sphereon/ssi-sdk.oid4vci-issuer-store'
import { IKeyValueStore, IValueData } from '@sphereon/ssi-sdk.kv-store-temp'
import { Oid4vciMetadataType } from '@sphereon/ssi-sdk.oid4vci-issuer-store/dist'

export enum FederationEndpoints {
  WELL_KNOWN_OPENID_FEDERATION = '/.well-known/openid-federation',
}

export type IRequiredContext = IAgentContext<IPlugins>

export type IPlugins = IFederationMetadata

export interface IOIDFMetadataServer extends IPluginMethodMap {
  FederationMetadataGetMetadata({ correlationId, storeId, namespace }: IFederationMetadataGetArgs): Promise<OpenidFederationMetadata | undefined>
  FederationMetadataListMetadata({ storeId, namespace }: IFederationMetadataListArgs): Promise<Array<OpenidFederationMetadata | undefined>>
  FederationMetadataHasMetadata({ metadataType, correlationId, storeId, namespace }: IFederationMetadataExistsArgs): Promise<boolean>
  FederationMetadataPersistMetadata(args: IMetadataPersistArgs): Promise<IValueData<OpenidFederationMetadata>>
  FederationMetadataRemoveMetadata({ metadataType, storeId, correlationId, namespace }: IFederationMetadataRemoveArgs): Promise<boolean>
  FederationMetadataClearAllMetadata({ metadataType, storeId }: IFederationMetadataClearArgs): Promise<boolean>
}

export interface IOID4MetadataServerOpts {
  storeId?: string
  namespace?: string
}

export interface OpenidFederationMetadata {
  subjectBaseUrl: string
  jwt: string
  enabled: boolean
}

export interface IFederationMetadataStoreListArgs {
  metadataType: Oid4vciMetadataType
  storeId?: string
  namespace?: string
}

export interface IFederationMetadataGetArgs extends IFederationMetadataStoreListArgs {
  correlationId: string
}

export type IFederationMetadataExistsArgs = IFederationMetadataGetArgs
export type IFederationMetadataRemoveArgs = IFederationMetadataGetArgs
