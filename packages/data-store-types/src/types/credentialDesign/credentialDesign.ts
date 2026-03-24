import { IBasicImageAttributes, IImageAttributes } from '../issuanceBranding/issuanceBranding'

export enum ValueType {
  Text = 'Text',
  Number = 'Number',
  Boolean = 'Boolean',
  Date = 'Date',
}

export type MetadataValue = {
  id: string
  index?: number
  textValue?: string
  numberValue?: number
  booleanValue?: boolean
  timestampValue?: Date
}

export type NonPersistedMetadataValue = Omit<MetadataValue, 'id'>

export type MetadataKey = {
  id: string
  key: string
  valueType: ValueType
  metadataValues: Array<MetadataValue>
}

export type NonPersistedMetadataKey = Omit<MetadataKey, 'id' | 'metadataValues'> & {
  metadataValues: Array<NonPersistedMetadataValue>
}

export type SchemaDefinition = {
  id: string
  tenantId?: string
  extendsId?: string
  correlationId?: string
  schemaType?: string
  entityType?: string
  schema: string
}

export type NonPersistedSchemaDefinition = Omit<SchemaDefinition, 'id'>

export type CredentialDesignBranding = {
  id: string
  textColor?: string
  backgroundColor?: string
  logo?: IImageAttributes
  backgroundImage?: IImageAttributes
}

export type NonPersistedCredentialDesignBranding = Omit<CredentialDesignBranding, 'id' | 'logo' | 'backgroundImage'> & {
  logo?: IBasicImageAttributes
  backgroundImage?: IBasicImageAttributes
}

export type CredentialDesign = {
  id: string
  identifier: string
  tenantId?: string
  metadataKeys: Array<MetadataKey>
  schemaDefinitions: Array<SchemaDefinition>
  branding?: CredentialDesignBranding
}

export type NonPersistedCredentialDesign = Omit<CredentialDesign, 'id' | 'metadataKeys' | 'schemaDefinitions' | 'branding'> & {
  metadataKeys?: Array<NonPersistedMetadataKey>
  schemaDefinitions?: Array<NonPersistedSchemaDefinition>
  branding?: NonPersistedCredentialDesignBranding
}
