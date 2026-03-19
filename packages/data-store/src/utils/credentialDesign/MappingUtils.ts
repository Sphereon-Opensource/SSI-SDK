import type {
  CredentialDesign,
  CredentialDesignBranding,
  IImageAttributes,
  MetadataKey,
  MetadataValue,
  NonPersistedCredentialDesignBranding,
  NonPersistedMetadataKey,
  NonPersistedMetadataValue,
  NonPersistedSchemaDefinition,
  SchemaDefinition,
} from '@sphereon/ssi-sdk.data-store-types'
import { CredentialDesignBrandingEntity } from '../../entities/credentialDesign'
import { MetadataKeyEntity, ValueType } from '../../entities/credentialDesign'
import { MetadataSetEntity } from '../../entities/credentialDesign'
import { MetadataValueEntity } from '../../entities/credentialDesign'
import { SchemaDefinitionEntity } from '../../entities/credentialDesign'
import { ImageAttributesEntity } from '../../entities/issuanceBranding/ImageAttributesEntity'
import { replaceNullWithUndefined } from '../FormattingUtils'
import { imageAttributesEntityFrom } from '../issuanceBranding/MappingUtils'

export const credentialDesignFrom = (entity: MetadataSetEntity): CredentialDesign => {
  const result: CredentialDesign = {
    id: entity.id,
    label: entity.name,
    tenantId: entity.tenantId,
    metadataKeys: entity.metadataKeys?.map((key) => metadataKeyFrom(key)) ?? [],
    schemaDefinitions: entity.schemaDefinitions?.map((schema) => schemaDefinitionFrom(schema)) ?? [],
    branding: entity.credentialDesignBranding ? credentialDesignBrandingFrom(entity.credentialDesignBranding) : undefined,
  }

  return replaceNullWithUndefined(result)
}

export const metadataKeyFrom = (entity: MetadataKeyEntity): MetadataKey => {
  const result: MetadataKey = {
    id: entity.id,
    key: entity.key,
    valueType: entity.valueType,
    metadataValues: entity.metadataValues?.map((value) => metadataValueFrom(value)) ?? [],
  }

  return replaceNullWithUndefined(result)
}

export const metadataValueFrom = (entity: MetadataValueEntity): MetadataValue => {
  const result: MetadataValue = {
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

export const metadataKeyEntityFrom = (input: NonPersistedMetadataKey): MetadataKeyEntity => {
  const keyEntity = new MetadataKeyEntity()
  keyEntity.key = input.key
  keyEntity.valueType = input.valueType as ValueType
  keyEntity.metadataValues = input.metadataValues.map((valInput) => metadataValueEntityFrom(valInput))
  return keyEntity
}

export const metadataValueEntityFrom = (input: NonPersistedMetadataValue): MetadataValueEntity => {
  const valEntity = new MetadataValueEntity()
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
