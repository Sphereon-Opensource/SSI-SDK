import {
  AbstractCredentialDesignStore,
  AddCredentialDesignArgs,
  CredentialDesign,
  GetCredentialDesignArgs,
  GetCredentialDesignsArgs,
  NonPersistedCredentialDesignBranding,
  NonPersistedMetaDataKey,
  NonPersistedSchemaDefinition,
  RemoveCredentialDesignArgs,
  UpdateCredentialDesignArgs,
} from '@sphereon/ssi-sdk.data-store-types'
import { OrPromise } from '@sphereon/ssi-types'
import Debug from 'debug'
import { DataSource, EntityManager, Repository } from 'typeorm'
import { MetaDataSetEntity, MetaDataKeyEntity, MetaDataValueEntity, SchemaDefinitionEntity, CredentialDesignBrandingEntity } from '../entities/credentialDesign'
import { ImageAttributesEntity } from '../entities/issuanceBranding/ImageAttributesEntity'
import { ImageDimensionsEntity } from '../entities/issuanceBranding/ImageDimensionsEntity'
import {
  credentialDesignBrandingEntityFrom,
  credentialDesignFrom,
  metaDataKeyEntityFrom,
  schemaDefinitionEntityFrom,
} from '../utils/credentialDesign/MappingUtils'

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

    return credentialDesignFrom(result)
  }

  getCredentialDesigns = async (args?: GetCredentialDesignsArgs): Promise<Array<CredentialDesign>> => {
    debug('getCredentialDesigns', args)
    const repo: Repository<MetaDataSetEntity> = (await this.dbConnection).getRepository(MetaDataSetEntity)
    const where = args?.filter?.tenantId ? { tenantId: args.filter.tenantId } : undefined
    const results = await repo.find({ where })
    return results.map(credentialDesignFrom)
  }

  addCredentialDesign = async (args: AddCredentialDesignArgs): Promise<CredentialDesign> => {
    debug('addCredentialDesign', args)
    const dataSource = await this.dbConnection

    return dataSource.transaction(async (transactionalEntityManager) => {
      const metaDataSet = new MetaDataSetEntity()
      metaDataSet.name = args.name
      metaDataSet.tenantId = args.tenantId
      metaDataSet.metaDataKeys = []
      metaDataSet.schemaDefinitions = []

      const { design } = args
      if (design) {
        if (design.metaDataKeys) {
          metaDataSet.metaDataKeys = design.metaDataKeys.map(metaDataKeyEntityFrom)
        }

        if (design.schemaDefinitions) {
          metaDataSet.schemaDefinitions = design.schemaDefinitions.map(schemaDefinitionEntityFrom)
        }

        if (design.branding) {
          metaDataSet.credentialDesignBranding = credentialDesignBrandingEntityFrom(design.branding)
        }
      }

      const saved = await transactionalEntityManager.save(MetaDataSetEntity, metaDataSet)
      return credentialDesignFrom(saved)
    })
  }

  updateCredentialDesign = async (args: UpdateCredentialDesignArgs): Promise<CredentialDesign> => {
    debug('updateCredentialDesign', args)
    const dataSource = await this.dbConnection

    return dataSource.transaction(async (transactionalEntityManager) => {
      const existing = await transactionalEntityManager.findOne(MetaDataSetEntity, {
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

      const { design } = args
      if (design) {
        if (design.metaDataKeys !== undefined) {
          await this.replaceMetaDataKeys(transactionalEntityManager, existing, design.metaDataKeys)
        }

        if (design.schemaDefinitions !== undefined) {
          await this.replaceSchemaDefinitions(transactionalEntityManager, existing, design.schemaDefinitions)
        }

        if (design.branding !== undefined) {
          await this.replaceBranding(transactionalEntityManager, existing, design.branding)
        }
      }

      const saved = await transactionalEntityManager.save(MetaDataSetEntity, existing)
      return credentialDesignFrom(saved)
    })
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

  private async replaceMetaDataKeys(
    entityManager: EntityManager,
    existing: MetaDataSetEntity,
    newKeys: Array<NonPersistedMetaDataKey>,
  ): Promise<void> {
    if (existing.metaDataKeys?.length) {
      for (const key of existing.metaDataKeys) {
        if (key.metaDataValues?.length) {
          await entityManager.remove(MetaDataValueEntity, key.metaDataValues)
        }
      }
      await entityManager.remove(MetaDataKeyEntity, existing.metaDataKeys)
    }
    existing.metaDataKeys = newKeys.map(metaDataKeyEntityFrom)
  }

  private async replaceSchemaDefinitions(
    entityManager: EntityManager,
    existing: MetaDataSetEntity,
    newSchemas: Array<NonPersistedSchemaDefinition>,
  ): Promise<void> {
    if (existing.schemaDefinitions?.length) {
      await entityManager.remove(SchemaDefinitionEntity, existing.schemaDefinitions)
    }
    existing.schemaDefinitions = newSchemas.map(schemaDefinitionEntityFrom)
  }

  private async replaceBranding(
    entityManager: EntityManager,
    existing: MetaDataSetEntity,
    newBranding: NonPersistedCredentialDesignBranding | undefined,
  ): Promise<void> {
    if (existing.credentialDesignBranding) {
      const oldLogo = existing.credentialDesignBranding.logo
      const oldBackgroundImage = existing.credentialDesignBranding.backgroundImage
      await entityManager.remove(CredentialDesignBrandingEntity, existing.credentialDesignBranding)
      await this.removeImageEntity(entityManager, oldLogo)
      await this.removeImageEntity(entityManager, oldBackgroundImage)
    }

    if (newBranding) {
      existing.credentialDesignBranding = credentialDesignBrandingEntityFrom(newBranding)
    } else {
      existing.credentialDesignBranding = undefined
    }
  }

  private async removeImageEntity(entityManager: EntityManager, image: ImageAttributesEntity | undefined): Promise<void> {
    if (!image) {
      return
    }
    const dimensions = image.dimensions
    await entityManager.remove(ImageAttributesEntity, image)
    if (dimensions) {
      await entityManager.remove(ImageDimensionsEntity, dimensions)
    }
  }
}
