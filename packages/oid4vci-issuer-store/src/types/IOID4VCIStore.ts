import { AuthorizationServerMetadata, ClientMetadata, CredentialIssuerMetadataOpts, IssuerMetadata } from '@sphereon/oid4vci-common'
import { IDIDOptions, ResolveOpts } from '@sphereon/ssi-sdk-ext.did-utils'
import { ManagedIdentifierOptsOrResult } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { IKeyValueStore, IValueData } from '@sphereon/ssi-sdk.kv-store-temp'
import { IPluginMethodMap } from '@veramo/core'

export type MetadataTypeMap = {
  issuer: IssuerMetadata
  authorizationServer: AuthorizationServerMetadata
}

export type OptionalIssuerMetadata = IssuerMetadata | AuthorizationServerMetadata | undefined
export type OptionalIssuerMetadataValue = IValueData<IssuerMetadata | AuthorizationServerMetadata> | undefined

export interface IOID4VCIStore extends IPluginMethodMap {
  oid4vciStoreDefaultMetadata(): Promise<IKeyValueStore<IssuerMetadata>>
  oid4vciStoreDefaultIssuerOptions(): Promise<IKeyValueStore<IIssuerOptions>>
  oid4vciStoreDefaultStoreId(): Promise<string>
  oid4vciStoreDefaultNamespace(): Promise<string>

  oid4vciStoreGetIssuerOpts({ correlationId, storeId, namespace }: IOid4vciStoreGetArgs): Promise<IIssuerOptions | undefined>
  oid4vciStoreHasIssuerOpts({ correlationId, storeId, namespace }: Ioid4vciStoreExistsArgs): Promise<boolean>
  oid4vciStorePersistIssuerOpts(args: IIssuerOptsPersistArgs): Promise<IValueData<IIssuerOptions>>
  oid4vciStoreRemoveIssuerOpts({ storeId, correlationId, namespace }: Ioid4vciStoreRemoveArgs): Promise<boolean>
  oid4vciStoreClearAllIssuerOpts({ storeId }: Ioid4vciStoreClearArgs): Promise<boolean>

  oid4vciStoreGetMetadata({
    metadataType,
    correlationId,
    storeId,
    namespace,
  }: IOid4vciStoreGetArgs): Promise<IssuerMetadata | AuthorizationServerMetadata | undefined>
  oid4vciStoreListMetadata({ metadataType, storeId, namespace }: IOid4vciStoreListArgs): Promise<Array<OptionalIssuerMetadata>>
  oid4vciStoreHasMetadata({ metadataType, correlationId, storeId, namespace }: Ioid4vciStoreExistsArgs): Promise<boolean>
  oid4vciStorePersistMetadata(args: IMetadataPersistArgs): Promise<OptionalIssuerMetadataValue>
  oid4vciStoreRemoveMetadata({ metadataType, storeId, correlationId, namespace }: Ioid4vciStoreRemoveArgs): Promise<boolean>
  oid4vciStoreClearAllMetadata({ metadataType, storeId }: Ioid4vciStoreClearArgs): Promise<boolean>
}

export interface IOID4VCIStoreOpts {
  defaultStore?: string
  defaultNamespace?: string
  issuerMetadataStores?: Map<string, IKeyValueStore<IssuerMetadata>> | IKeyValueStore<IssuerMetadata>
  authorizationServerMetadataStores?: Map<string, IKeyValueStore<AuthorizationServerMetadata>> | IKeyValueStore<AuthorizationServerMetadata>
  issuerOptsStores?: Map<string, IKeyValueStore<IIssuerOptions>> | IKeyValueStore<IIssuerOptions>
  importMetadatas?: IMetadataImportArgs[]
  importIssuerOpts?: IIssuerOptsImportArgs[]
  defaultOpts?: IIssuerDefaultOpts
  instanceOpts?: IIssuerInstanceOptions[]
}

export interface IIssuerDefaultOpts extends IIssuerOptions {}

export interface IIssuerInstanceOptions extends IMetadataOptions {
  issuerOpts?: IIssuerOptions
  metadata?: CredentialIssuerMetadataOpts
}

export interface IIssuerOptions {
  asClientOpts?: ClientMetadata
  idOpts?: ManagedIdentifierOptsOrResult
  resolveOpts?: ResolveOpts
  /**
   * @deprecated use idOpts which is more capable and supports x5c and jwks next to dids
   */
  didOpts?: IDIDOptions
  userPinRequired?: boolean
  cNonceExpiresIn?: number

  /**
   * Used in the callbacks for the first party flow
   */
  // FIXME SPRIND-151 we need to start supporting a map with a definition id per credential, we can use the credential offer session to check which credential is being issued and then look it up in this map
  presentationDefinitionId?: string
}

export interface IMetadataOptions {
  credentialIssuer: string //The Credential Issuer's identifier.
  storeId?: string
  storeNamespace?: string
}

export type MetadataType = 'issuer' | 'authorizationServer' | 'openidFederation' // we do not have ssi-types here

export interface IOid4vciStoreListArgs {
  metadataType: MetadataType
  storeId?: string
  namespace?: string
}

export interface IOid4vciStoreGetArgs extends IOid4vciStoreListArgs {
  correlationId: string
}

export type Ioid4vciStoreExistsArgs = IOid4vciStoreGetArgs
// export type Ioid4vciStoreClearArgs = Ioid4vciStoreGetArgs
export type Ioid4vciStoreRemoveArgs = IOid4vciStoreGetArgs

export interface IMetadataImportArgs {
  // Global version from ssi-types
  metadataType: MetadataType
}
export type IIssuerMetadataImportArgs = IMetadataPersistArgs
export type IIssuerOptsImportArgs = IIssuerOptsPersistArgs

export interface IMetadataPersistArgs extends Ioid4vciStorePersistArgs, IMetadataImportArgs {
  metadata: IssuerMetadata | AuthorizationServerMetadata
}

export interface IIssuerOptsPersistArgs extends Ioid4vciStorePersistArgs {
  issuerOpts: IIssuerOptions
  endpointOpts: unknown // FIXME these types are all in OID4VC all over the place
}
export interface Ioid4vciStorePersistArgs {
  correlationId: string // The credential Issuer to store the metadata for
  overwriteExisting?: boolean // Whether to overwrite any existing metadata for a credential issuer. Defaults to true
  validation?: boolean // Whether to check the metadata. Defaults to true
  ttl?: number // How long should the metadata be stored in seconds. By default, it will be indefinite
  storeId?: string // The store id to use. Allows you to use multiple different stores next to each-other
  namespace?: string // The namespace (prefix) to use whilst storing the metadata. Allows you to partition metadata objects
}

export interface Ioid4vciStoreClearArgs {
  metadataType: MetadataType
  storeId?: string
  // namespace?: string
}
