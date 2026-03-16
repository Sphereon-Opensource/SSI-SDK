import {
  AbstractCredentialDesignStore,
  AddCredentialDesignArgs,
  CredentialDesign,
  CredentialDesignBranding,
  GetCredentialDesignArgs,
  GetCredentialDesignsArgs,
  MetaDataKey,
  MetaDataValue,
  RemoveCredentialDesignArgs,
  SchemaDefinition,
  UpdateCredentialDesignArgs,
} from '@sphereon/ssi-sdk.data-store-types'
import { OrPromise } from '@sphereon/ssi-types'
import Debug from 'debug'
import { DataSource, Repository } from 'typeorm'
import { MetaDataSetEntity } from '../entities/credentialDesign'
import { CredentialDesignBrandingEntity } from '../entities/credentialDesign/CredentialDesignBrandingEntity'
import { MetaDataKeyEntity } from '../entities/credentialDesign/MetaDataKeyEntity'
import { MetaDataValueEntity } from '../entities/credentialDesign/MetaDataValueEntity'
import { SchemaDefinitionEntity } from '../entities/credentialDesign/SchemaDefinitionEntity'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:credential-design-store')

export class CredentialDesignStore extends AbstractCredentialDesignStore {
  private readonly dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    super()
    this.dbConnection = dbConnection
  }

  getCredentialDesign = async (args: GetCredentialDesignArgs): Promise<CredentialDesign> => {
    const { credentialDesignId } = args
    debug('getCredentialDesign', credentialDesignId)
    const repo: Repository<MetaDataSetEntity> = (await this.dbConnection).getRepository(MetaDataSetEntity)
    const result = await repo.findOne({
      where: { id: credentialDesignId },
    })

    if (!result) {
      return Promise.reject(Error(`No credential design found for id: ${credentialDesignId}`))
    }

    return this.metaDataSetToCredentialDesign(result)
  }

  getCredentialDesigns = async (args?: GetCredentialDesignsArgs): Promise<Array<CredentialDesign>> => {
    debug('getCredentialDesigns', args)
    const repo: Repository<MetaDataSetEntity> = (await this.dbConnection).getRepository(MetaDataSetEntity)
    const where = args?.filter?.tenantId ? { tenantId: args.filter.tenantId } : undefined
    const results = await repo.find({ where })
    return results.map((entity) => this.metaDataSetToCredentialDesign(entity))
  }

  addCredentialDesign = async (args: AddCredentialDesignArgs): Promise<CredentialDesign> => {
    debug('addCredentialDesign', args)
    const repo: Repository<MetaDataSetEntity> = (await this.dbConnection).getRepository(MetaDataSetEntity)

    const metaDataSet = new MetaDataSetEntity()
    metaDataSet.name = args.name
    metaDataSet.tenantId = args.tenantId
    metaDataSet.metaDataKeys = []
    metaDataSet.schemaDefinitions = []

    const saved = await repo.save(metaDataSet)
    return this.metaDataSetToCredentialDesign(saved)
  }

  updateCredentialDesign = async (args: UpdateCredentialDesignArgs): Promise<CredentialDesign> => {
    debug('updateCredentialDesign', args)
    const repo: Repository<MetaDataSetEntity> = (await this.dbConnection).getRepository(MetaDataSetEntity)
    const existing = await repo.findOne({
      where: { id: args.credentialDesignId },
    })

    if (!existing) {
      return Promise.reject(Error(`No credential design found for id: ${args.credentialDesignId}`))
    }

    if (args.name !== undefined) {
      existing.name = args.name
    }
    if (args.tenantId !== undefined) {
      existing.tenantId = args.tenantId
    }

    const saved = await repo.save(existing)
    return this.metaDataSetToCredentialDesign(saved)
  }

  removeCredentialDesign = async (args: RemoveCredentialDesignArgs): Promise<void> => {
    debug('removeCredentialDesign', args)
    const repo: Repository<MetaDataSetEntity> = (await this.dbConnection).getRepository(MetaDataSetEntity)
    const existing = await repo.findOne({
      where: { id: args.credentialDesignId },
    })

    if (!existing) {
      return Promise.reject(Error(`No credential design found for id: ${args.credentialDesignId}`))
    }

    await repo.remove(existing)
  }

  private metaDataSetToCredentialDesign(entity: MetaDataSetEntity): CredentialDesign {
    return {
      id: entity.id,
      label: entity.name,
      tenantId: entity.tenantId,
      metaDataKeys: entity.metaDataKeys?.map((key) => this.metaDataKeyToType(key)) ?? [],
      schemaDefinitions: entity.schemaDefinitions?.map((schema) => this.schemaDefinitionToType(schema)) ?? [],
      branding: entity.credentialDesignBranding ? this.brandingToType(entity.credentialDesignBranding) : undefined,
    }
  }

  private metaDataKeyToType(entity: MetaDataKeyEntity): MetaDataKey {
    return {
      id: entity.id,
      key: entity.key,
      valueType: entity.valueType,
      metaDataValues: entity.metaDataValues?.map((value) => this.metaDataValueToType(value)) ?? [],
    }
  }

  private metaDataValueToType(entity: MetaDataValueEntity): MetaDataValue {
    return {
      id: entity.id,
      index: entity.index,
      textValue: entity.textValue,
      numberValue: entity.numberValue,
      booleanValue: entity.booleanValue,
      timestampValue: entity.timestampValue,
    }
  }

  private schemaDefinitionToType(entity: SchemaDefinitionEntity): SchemaDefinition {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      extendsId: entity.extendsId,
      correlationId: entity.correlationId,
      schemaType: entity.schemaType,
      entityType: entity.entityType,
      schema: entity.schema,
    }
  }

  private brandingToType(entity: CredentialDesignBrandingEntity): CredentialDesignBranding {
    return {
      id: entity.id,
      textColor: entity.textColor,
      backgroundColor: entity.backgroundColor,
      logo: entity.logo
        ? {
            id: entity.logo.id,
            uri: entity.logo.uri,
            dataUri: entity.logo.dataUri,
            mediaType: entity.logo.mediaType,
            alt: entity.logo.alt,
          }
        : undefined,
      backgroundImage: entity.backgroundImage
        ? {
            id: entity.backgroundImage.id,
            uri: entity.backgroundImage.uri,
            dataUri: entity.backgroundImage.dataUri,
            mediaType: entity.backgroundImage.mediaType,
            alt: entity.backgroundImage.alt,
          }
        : undefined,
    }
  }
}
