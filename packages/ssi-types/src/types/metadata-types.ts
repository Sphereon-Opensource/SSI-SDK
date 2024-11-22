export type MetadataType = 'issuer' | 'authorizationServer' | 'openidFederation'

export interface IMetadataImportArgs {
  metadataType: MetadataType
}
