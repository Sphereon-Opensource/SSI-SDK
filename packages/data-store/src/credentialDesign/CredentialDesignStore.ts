import {
  AbstractCredentialDesignStore,
  AddCredentialDesignArgs,
  CountCredentialDesignsArgs,
  CredentialDesign,
  FormStepGetOrCreateArgs,
  GetCredentialDesignArgs,
  GetCredentialDesignsArgs,
  NonPersistedCredentialDesignBranding,
  NonPersistedMetadataKey,
  NonPersistedSchemaDefinition,
  RemoveCredentialDesignArgs,
  UpdateCredentialDesignArgs,
} from '@sphereon/ssi-sdk.data-store-types'
import { OrPromise } from '@sphereon/ssi-types'
import Debug from 'debug'
import { DataSource, EntityManager, Repository } from 'typeorm'
import { MetadataSetEntity, MetadataKeyEntity, MetadataValueEntity, SchemaDefinitionEntity, CredentialDesignBrandingEntity, FormStepEntity } from '../entities/credentialDesign'
import { ImageAttributesEntity } from '../entities/issuanceBranding/ImageAttributesEntity'
import { ImageDimensionsEntity } from '../entities/issuanceBranding/ImageDimensionsEntity'
import {
  credentialDesignBrandingEntityFrom,
  credentialDesignFrom,
  metadataKeyEntityFrom,
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
    const repo: Repository<MetadataSetEntity> = (await this.dbConnection).getRepository(MetadataSetEntity)
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
    const repo: Repository<MetadataSetEntity> = (await this.dbConnection).getRepository(MetadataSetEntity)
    const where = args?.filter?.tenantId ? { tenantId: args.filter.tenantId } : undefined
    const results = await repo.find({
      where,
      order: { name: 'ASC' },
      take: args?.limit,
      skip: args?.offset,
    })
    return results.map(credentialDesignFrom)
  }

  countCredentialDesigns = async (args?: CountCredentialDesignsArgs): Promise<number> => {
    debug('countCredentialDesigns', args)
    const repo: Repository<MetadataSetEntity> = (await this.dbConnection).getRepository(MetadataSetEntity)
    const where = args?.filter?.tenantId ? { tenantId: args.filter.tenantId } : undefined
    return repo.count({ where })
  }

  addCredentialDesign = async (args: AddCredentialDesignArgs): Promise<CredentialDesign> => {
    debug('addCredentialDesign', args)
    const dataSource = await this.dbConnection

    return dataSource.transaction(async (transactionalEntityManager) => {
      const metadataSet = new MetadataSetEntity()
      metadataSet.name = args.identifier
      metadataSet.tenantId = args.tenantId
      metadataSet.metadataKeys = []
      metadataSet.schemaDefinitions = []

      const { design } = args
      if (design) {
        if (design.metadataKeys) {
          metadataSet.metadataKeys = design.metadataKeys.map(metadataKeyEntityFrom)
        }

        if (design.schemaDefinitions) {
          metadataSet.schemaDefinitions = design.schemaDefinitions.map(schemaDefinitionEntityFrom)
        }

        if (design.branding) {
          metadataSet.credentialDesignBranding = credentialDesignBrandingEntityFrom(design.branding)
        }
      }

      const saved = await transactionalEntityManager.save(MetadataSetEntity, metadataSet)

      if (args.formStepId && saved.schemaDefinitions?.length) {
        const formStep = await transactionalEntityManager.findOne(FormStepEntity, {
          where: { id: args.formStepId },
        })
        if (formStep) {
          formStep.schemaDefinitions = [...(formStep.schemaDefinitions ?? []), ...saved.schemaDefinitions]
          await transactionalEntityManager.save(FormStepEntity, formStep)
        }
      }

      return credentialDesignFrom(saved)
    })
  }

  updateCredentialDesign = async (args: UpdateCredentialDesignArgs): Promise<CredentialDesign> => {
    debug('updateCredentialDesign', args)
    const dataSource = await this.dbConnection

    return dataSource.transaction(async (transactionalEntityManager) => {
      const existing = await transactionalEntityManager.findOne(MetadataSetEntity, {
        where: { id: args.credentialDesignId },
      })

      if (!existing) {
        return Promise.reject(Error(`No credential design found for id: ${args.credentialDesignId}`))
      }

      if (args.identifier !== undefined) {
        existing.name = args.identifier
      }
      if (args.tenantId !== undefined) {
        existing.tenantId = args.tenantId
      }

      const { design } = args
      if (design) {
        if (design.metadataKeys !== undefined) {
          await this.replaceMetadataKeys(transactionalEntityManager, existing, design.metadataKeys)
        }

        if (design.schemaDefinitions !== undefined) {
          await this.replaceSchemaDefinitions(transactionalEntityManager, existing, design.schemaDefinitions)
        }

        if (design.branding !== undefined) {
          await this.replaceBranding(transactionalEntityManager, existing, design.branding)
        }
      }

      const saved = await transactionalEntityManager.save(MetadataSetEntity, existing)
      return credentialDesignFrom(saved)
    })
  }

  formStepGetOrCreate = async (args: FormStepGetOrCreateArgs): Promise<string> => {
    debug('formStepGetOrCreate', args)
    const repo: Repository<FormStepEntity> = (await this.dbConnection).getRepository(FormStepEntity)
    const existing = await repo.findOne({ where: { formId: args.formStepId } })
    if (existing) {
      return existing.id
    }
    const formStep = new FormStepEntity()
    formStep.formId = args.formStepId
    formStep.stepNr = 1
    formStep.order = 1
    const saved = await repo.save(formStep)
    return saved.id
  }

  removeCredentialDesign = async (args: RemoveCredentialDesignArgs): Promise<void> => {
    debug('removeCredentialDesign', args)
    const repo: Repository<MetadataSetEntity> = (await this.dbConnection).getRepository(MetadataSetEntity)
    const existing = await repo.findOne({
      where: { id: args.credentialDesignId },
    })

    if (!existing) {
      return Promise.reject(Error(`No credential design found for id: ${args.credentialDesignId}`))
    }

    await repo.remove(existing)
  }

  private async replaceMetadataKeys(
    entityManager: EntityManager,
    existing: MetadataSetEntity,
    newKeys: Array<NonPersistedMetadataKey>,
  ): Promise<void> {
    if (existing.metadataKeys?.length) {
      for (const key of existing.metadataKeys) {
        if (key.metadataValues?.length) {
          await entityManager.remove(MetadataValueEntity, key.metadataValues)
        }
      }
      await entityManager.remove(MetadataKeyEntity, existing.metadataKeys)
    }
    existing.metadataKeys = newKeys.map(metadataKeyEntityFrom)
  }

  private async replaceSchemaDefinitions(
    entityManager: EntityManager,
    existing: MetadataSetEntity,
    newSchemas: Array<NonPersistedSchemaDefinition>,
  ): Promise<void> {
    if (existing.schemaDefinitions?.length) {
      await entityManager.remove(SchemaDefinitionEntity, existing.schemaDefinitions)
    }
    existing.schemaDefinitions = newSchemas.map(schemaDefinitionEntityFrom)
  }

  private async replaceBranding(
    entityManager: EntityManager,
    existing: MetadataSetEntity,
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
