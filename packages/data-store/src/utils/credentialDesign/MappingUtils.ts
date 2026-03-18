import type {
  CredentialDesign,
  CredentialDesignBranding,
  IImageAttributes,
  MetaDataKey,
  MetaDataValue,
  NonPersistedCredentialDesignBranding,
  NonPersistedMetaDataKey,
  NonPersistedMetaDataValue,
  NonPersistedSchemaDefinition,
  SchemaDefinition,
} from '@sphereon/ssi-sdk.data-store-types'
import { CredentialDesignBrandingEntity } from '../../entities/credentialDesign'
import { MetaDataKeyEntity, ValueType } from '../../entities/credentialDesign'
import { MetaDataSetEntity } from '../../entities/credentialDesign'
import { MetaDataValueEntity } from '../../entities/credentialDesign'
import { SchemaDefinitionEntity } from '../../entities/credentialDesign'
import { ImageAttributesEntity } from '../../entities/issuanceBranding/ImageAttributesEntity'
import { replaceNullWithUndefined } from '../FormattingUtils'
import { imageAttributesEntityFrom } from '../issuanceBranding/MappingUtils'

export const credentialDesignFrom = (entity: MetaDataSetEntity): CredentialDesign => {
  const result: CredentialDesign = {
    id: entity.id,
    label: entity.name,
    tenantId: entity.tenantId,
    metaDataKeys: entity.metaDataKeys?.map((key) => metaDataKeyFrom(key)) ?? [],
    schemaDefinitions: entity.schemaDefinitions?.map((schema) => schemaDefinitionFrom(schema)) ?? [],
    branding: entity.credentialDesignBranding ? credentialDesignBrandingFrom(entity.credentialDesignBranding) : undefined,
  }

  return replaceNullWithUndefined(result)
}

export const metaDataKeyFrom = (entity: MetaDataKeyEntity): MetaDataKey => {
  const result: MetaDataKey = {
    id: entity.id,
    key: entity.key,
    valueType: entity.valueType,
    metaDataValues: entity.metaDataValues?.map((value) => metaDataValueFrom(value)) ?? [],
  }

  return replaceNullWithUndefined(result)
}

export const metaDataValueFrom = (entity: MetaDataValueEntity): MetaDataValue => {
  const result: MetaDataValue = {
    id: entity.id,
    index: entity.index,
    textValue: entity.textValue,
    numberValue: entity.numberValue,
    booleanValue: entity.booleanValue,
    timestampValue: entity.timestampValue,
  }

  return replaceNullWithUndefined(result)
}

export const schemaDefinitionFrom = (entity: SchemaDefinitionEntity): SchemaDefinition => {
  const result: SchemaDefinition = {
    id: entity.id,
    tenantId: entity.tenantId,
    extendsId: entity.extendsId,
    correlationId: entity.correlationId,
    schemaType: entity.schemaType,
    entityType: entity.entityType,
    schema: entity.schema,
  }

  return replaceNullWithUndefined(result)
}

export const credentialDesignBrandingFrom = (entity: CredentialDesignBrandingEntity): CredentialDesignBranding => {
  const result: CredentialDesignBranding = {
    id: entity.id,
    textColor: entity.textColor,
    backgroundColor: entity.backgroundColor,
    logo: entity.logo ? imageAttributesFrom(entity.logo) : undefined,
    backgroundImage: entity.backgroundImage ? imageAttributesFrom(entity.backgroundImage) : undefined,
  }

  return replaceNullWithUndefined(result)
}

export const imageAttributesFrom = (entity: ImageAttributesEntity): IImageAttributes => {
  const result: IImageAttributes = {
    id: entity.id,
    uri: entity.uri,
    dataUri: entity.dataUri,
    mediaType: entity.mediaType,
    alt: entity.alt,
    dimensions: entity.dimensions
      ? {
          id: entity.dimensions.id,
          width: entity.dimensions.width,
          height: entity.dimensions.height,
        }
      : undefined,
  }

  return replaceNullWithUndefined(result)
}

export const metaDataKeyEntityFrom = (input: NonPersistedMetaDataKey): MetaDataKeyEntity => {
  const keyEntity = new MetaDataKeyEntity()
  keyEntity.key = input.key
  keyEntity.valueType = input.valueType as ValueType
  keyEntity.metaDataValues = input.metaDataValues.map((valInput) => metaDataValueEntityFrom(valInput))
  return keyEntity
}

export const metaDataValueEntityFrom = (input: NonPersistedMetaDataValue): MetaDataValueEntity => {
  const valEntity = new MetaDataValueEntity()
  valEntity.index = input.index
  valEntity.textValue = input.textValue
  valEntity.numberValue = input.numberValue
  valEntity.booleanValue = input.booleanValue
  valEntity.timestampValue = input.timestampValue
  return valEntity
}

export const schemaDefinitionEntityFrom = (input: NonPersistedSchemaDefinition): SchemaDefinitionEntity => {
  const schemaEntity = new SchemaDefinitionEntity()
  schemaEntity.tenantId = input.tenantId
  schemaEntity.extendsId = input.extendsId
  schemaEntity.correlationId = input.correlationId
  schemaEntity.schemaType = input.schemaType
  schemaEntity.entityType = input.entityType
  schemaEntity.schema = input.schema
  return schemaEntity
}

export const credentialDesignBrandingEntityFrom = (input: NonPersistedCredentialDesignBranding): CredentialDesignBrandingEntity => {
  const brandingEntity = new CredentialDesignBrandingEntity()
  brandingEntity.textColor = input.textColor
  brandingEntity.backgroundColor = input.backgroundColor

  if (input.logo) {
    brandingEntity.logo = imageAttributesEntityFrom(input.logo)
  }

  if (input.backgroundImage) {
    brandingEntity.backgroundImage = imageAttributesEntityFrom(input.backgroundImage)
  }

  return brandingEntity
}
