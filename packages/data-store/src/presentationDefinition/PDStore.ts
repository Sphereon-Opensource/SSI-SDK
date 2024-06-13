import { OrPromise } from '@sphereon/ssi-types'
import { DataSource, In, Repository } from 'typeorm'
import { AbstractPDStore } from './AbstractPDStore'
import Debug from 'debug'
import {
  DeleteDefinitionArgs,
  DeleteDefinitionsArgs,
  GetDefinitionArgs,
  GetDefinitionsArgs,
  HasDefinitionArgs,
  HasDefinitionsArgs,
  NonPersistedPresentationDefinitionItem,
  PresentationDefinitionItem,
  PresentationDefinitionItemFilter,
} from '../types'
import { PresentationDefinitionItemEntity } from '../entities/presentationDefinition/PresentationDefinitionItemEntity'
import { presentationDefinitionEntityItemFrom, presentationDefinitionItemFrom } from '../utils/presentationDefinition/MappingUtils'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:pd-store')

export class PDStore extends AbstractPDStore {
  private readonly dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    super()
    this.dbConnection = dbConnection
  }

  getDefinition = async (args: GetDefinitionArgs): Promise<PresentationDefinitionItem> => {
    const { itemId } = args ?? {}
    const pdRepository = (await this.dbConnection).getRepository(PresentationDefinitionItemEntity)
    const result: PresentationDefinitionItemEntity | null = await pdRepository.findOne({
      where: { id: itemId },
    })
    if (!result) {
      return Promise.reject(Error(`No presentation definition item found for id: ${itemId}`))
    }

    return presentationDefinitionItemFrom(result)
  }

  hasDefinition = async (args: HasDefinitionArgs): Promise<boolean> => {
    const { itemId } = args ?? {}
    const pdRepository = (await this.dbConnection).getRepository(PresentationDefinitionItemEntity)

    const resultCount: number = await pdRepository.count({
      where: { id: itemId },
    })

    return resultCount > 0
  }

  hasDefinitions = async (args: HasDefinitionsArgs): Promise<boolean> => {
    const { filter } = args
    const pdRepository = (await this.dbConnection).getRepository(PresentationDefinitionItemEntity)

    const resultCount: number = await pdRepository.count({
      ...(filter && { where: cleanFilter(filter) }),
    })
    return resultCount > 0
  }

  getDefinitions = async (args: GetDefinitionsArgs): Promise<Array<PresentationDefinitionItem>> => {
    const { filter } = args
    const pdRepository = (await this.dbConnection).getRepository(PresentationDefinitionItemEntity)
    const initialResult = await this.findIds(pdRepository, filter)
    const result: Array<PresentationDefinitionItemEntity> = await pdRepository.find({
      where: {
        id: In(initialResult.map((entity: PresentationDefinitionItemEntity) => entity.id)),
      },
      order: {
        version: 'DESC',
      },
    })

    return result.map((entity: PresentationDefinitionItemEntity) => presentationDefinitionItemFrom(entity))
  }

  addDefinition = async (item: NonPersistedPresentationDefinitionItem): Promise<PresentationDefinitionItem> => {
    const pdRepository = (await this.dbConnection).getRepository(PresentationDefinitionItemEntity)

    const entity: PresentationDefinitionItemEntity = presentationDefinitionEntityItemFrom(item)
    debug('Adding presentation definition entity', item)
    const result: PresentationDefinitionItemEntity = await pdRepository.save(entity, {
      transaction: true,
    })

    return presentationDefinitionItemFrom(result)
  }

  updateDefinition = async (item: PresentationDefinitionItem): Promise<PresentationDefinitionItem> => {
    const pdRepository = (await this.dbConnection).getRepository(PresentationDefinitionItemEntity)

    const result: PresentationDefinitionItemEntity | null = await pdRepository.findOne({
      where: { id: item.id },
    })
    if (!result) {
      return Promise.reject(Error(`No presentation definition entity found for id: ${item.id}`))
    }

    const updatedEntity: Partial<PresentationDefinitionItemEntity> = {
      ...result,
    }
    updatedEntity.tenantId = item.tenantId
    updatedEntity.definitionId = item.definitionId!
    updatedEntity.version = item.version
    updatedEntity.name = item.name
    updatedEntity.purpose = item.purpose
    updatedEntity.definitionPayload = JSON.stringify(item.definitionPayload!)

    debug('Updating presentation definition entity', updatedEntity)
    const updateResult: PresentationDefinitionItemEntity = await pdRepository.save(updatedEntity, {
      transaction: true,
    })

    return presentationDefinitionItemFrom(updateResult)
  }

  deleteDefinition = async (args: DeleteDefinitionArgs): Promise<void> => {
    const { itemId } = args

    const pdRepository = (await this.dbConnection).getRepository(PresentationDefinitionItemEntity)
    const entity: PresentationDefinitionItemEntity | null = await pdRepository.findOne({
      where: { id: itemId },
    })

    if (!entity) {
      return Promise.reject(Error(`No presentation definition found with id: ${itemId}`))
    }

    debug('Deleting presentation definition entity', entity)
    await pdRepository.delete(entity.id)
  }

  deleteDefinitions = async (args: DeleteDefinitionsArgs): Promise<number> => {
    const { filter } = args
    const pdRepository = (await this.dbConnection).getRepository(PresentationDefinitionItemEntity)
    const initialResult = await this.findIds(pdRepository, filter)

    const result: Array<PresentationDefinitionItemEntity> = await pdRepository.find({
      where: {
        id: In(initialResult.map((entity: PresentationDefinitionItemEntity) => entity.id)),
      },
    })

    for (const entity of result) {
      debug('Deleting presentation definition entity', entity.id)
      await pdRepository.delete(entity.id)
    }
    return result.length
  }

  findIds = async (
    pdRepository: Repository<PresentationDefinitionItemEntity>,
    filter: Array<PresentationDefinitionItemFilter> | undefined,
  ): Promise<Array<PresentationDefinitionItemEntity>> => {
    const idFilters = filter?.map((f) => f.id).filter((id) => id !== undefined && id !== null)
    if (idFilters && idFilters.length > 0 && idFilters.length === filter?.length) {
      return await pdRepository.find({
        where: { id: In(idFilters) },
      })
    } else {
      return await pdRepository.find({
        ...(filter && { where: cleanFilter(filter) }), // TODO test how mixing filters work
      })
    }
  }
}

const cleanFilter = (filter: Array<PresentationDefinitionItemFilter> | undefined): Array<PresentationDefinitionItemFilter> | undefined => {
  if (filter === undefined) {
    return undefined
  }

  return filter.map((item) => {
    const cleanedItem: PresentationDefinitionItemFilter = {}
    for (const key in item) {
      const value = item[key as keyof PresentationDefinitionItemFilter]
      if (value !== undefined) {
        ;(cleanedItem as any)[key] = value
      }
    }
    return cleanedItem
  })
}
