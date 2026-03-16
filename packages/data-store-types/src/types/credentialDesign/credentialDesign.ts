import { IBasicImageAttributes, IImageAttributes } from '../issuanceBranding/issuanceBranding'

export enum ValueType {
  Text = 'Text',
  Number = 'Number',
  Boolean = 'Boolean',
  Date = 'Date',
}

export type MetaDataValue = {
  id: string
  index?: number
  textValue?: string
  numberValue?: number
  booleanValue?: boolean
  timestampValue?: Date
}

export type NonPersistedMetaDataValue = Omit<MetaDataValue, 'id'>

export type MetaDataKey = {
  id: string
  key: string
  valueType: ValueType
  metaDataValues: Array<MetaDataValue>
}

export type NonPersistedMetaDataKey = Omit<MetaDataKey, 'id' | 'metaDataValues'> & {
  metaDataValues: Array<NonPersistedMetaDataValue>
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
  label: string
  tenantId?: string
  metaDataKeys: Array<MetaDataKey>
  schemaDefinitions: Array<SchemaDefinition>
  branding?: CredentialDesignBranding
}

export type NonPersistedCredentialDesign = Omit<CredentialDesign, 'id' | 'metaDataKeys' | 'schemaDefinitions' | 'branding'> & {
  metaDataKeys?: Array<NonPersistedMetaDataKey>
  schemaDefinitions?: Array<NonPersistedSchemaDefinition>
  branding?: NonPersistedCredentialDesignBranding
}
