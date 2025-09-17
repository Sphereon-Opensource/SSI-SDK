import { type OrPromise } from '@sphereon/ssi-types'
import { DataSource, In, Repository } from 'typeorm'
import { AbstractPDStore } from './AbstractPDStore'
import Debug from 'debug'
import type {
  DeleteDefinitionArgs,
  DeleteDefinitionsArgs,
  GetDefinitionArgs,
  GetDefinitionsArgs,
  HasDefinitionArgs,
  HasDefinitionsArgs,
  NonPersistedDcqlQueryItem,
  DcqlQueryItem,
  DcqlQueryItemFilter,
} from '../types'
import { DcqlQueryItemEntity } from '../entities/presentationDefinition/DcqlQueryItemEntity'
import { presentationDefinitionEntityItemFrom, presentationDefinitionItemFrom } from '../utils/presentationDefinition/MappingUtils'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:pd-store')

export class PDStore extends AbstractPDStore {
  private readonly dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    super()
    this.dbConnection = dbConnection
  }

  getDefinition = async (args: GetDefinitionArgs): Promise<DcqlQueryItem> => {
    const { itemId } = args ?? {}
    const pdRepository = (await this.dbConnection).getRepository(DcqlQueryItemEntity)
    const result: DcqlQueryItemEntity | null = await pdRepository.findOne({
      where: { id: itemId },
    })
    if (!result) {
      return Promise.reject(Error(`No presentation definition item found for id: ${itemId}`))
    }

    return presentationDefinitionItemFrom(result)
  }

  hasDefinition = async (args: HasDefinitionArgs): Promise<boolean> => {
    const { itemId } = args ?? {}
    const pdRepository = (await this.dbConnection).getRepository(DcqlQueryItemEntity)

    const resultCount: number = await pdRepository.count({
      where: { id: itemId },
    })

    return resultCount > 0
  }

  hasDefinitions = async (args: HasDefinitionsArgs): Promise<boolean> => {
    const { filter } = args
    const pdRepository = (await this.dbConnection).getRepository(DcqlQueryItemEntity)

    const resultCount: number = await pdRepository.count({
      ...(filter && { where: cleanFilter(filter) }),
    })
    return resultCount > 0
  }

  getDefinitions = async (args: GetDefinitionsArgs): Promise<Array<DcqlQueryItem>> => {
    const { filter } = args
    const pdRepository = (await this.dbConnection).getRepository(DcqlQueryItemEntity)
    const initialResult = await this.findIds(pdRepository, filter)
    const result: Array<DcqlQueryItemEntity> = await pdRepository.find({
      where: {
        id: In(initialResult.map((entity: DcqlQueryItemEntity) => entity.id)),
      },
      order: {
        version: 'DESC',
      },
    })

    return result.map((entity: DcqlQueryItemEntity) => presentationDefinitionItemFrom(entity))
  }

  addDefinition = async (item: NonPersistedDcqlQueryItem): Promise<DcqlQueryItem> => {
    const pdRepository = (await this.dbConnection).getRepository(DcqlQueryItemEntity)

    const entity: DcqlQueryItemEntity = presentationDefinitionEntityItemFrom(item)
    debug('Adding presentation definition entity', item)
    const result: DcqlQueryItemEntity = await pdRepository.save(entity, {
      transaction: true,
    })

    return presentationDefinitionItemFrom(result)
  }

  updateDefinition = async (item: DcqlQueryItem): Promise<DcqlQueryItem> => {
    const pdRepository = (await this.dbConnection).getRepository(DcqlQueryItemEntity)

    const result: DcqlQueryItemEntity | null = await pdRepository.findOne({
      where: { id: item.id },
    })
    if (!result) {
      return Promise.reject(Error(`No presentation definition entity found for id: ${item.id}`))
    }

    const updatedEntity: Partial<DcqlQueryItemEntity> = {
      ...result,
    }
    updatedEntity.tenantId = item.tenantId
    updatedEntity.queryId = item.queryId!
    updatedEntity.version = item.version
    updatedEntity.name = item.name
    updatedEntity.purpose = item.purpose
    updatedEntity.dcqlPayload = JSON.stringify(item.dcqlQuery)

    debug('Updating presentation definition entity', updatedEntity)
    const updateResult: DcqlQueryItemEntity = await pdRepository.save(updatedEntity, {
      transaction: true,
    })

    return presentationDefinitionItemFrom(updateResult)
  }

  deleteDefinition = async (args: DeleteDefinitionArgs): Promise<void> => {
    const { itemId } = args

    const pdRepository = (await this.dbConnection).getRepository(DcqlQueryItemEntity)
    const entity: DcqlQueryItemEntity | null = await pdRepository.findOne({
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
    const pdRepository = (await this.dbConnection).getRepository(DcqlQueryItemEntity)
    const initialResult = await this.findIds(pdRepository, filter)

    const result: Array<DcqlQueryItemEntity> = await pdRepository.find({
      where: {
        id: In(initialResult.map((entity: DcqlQueryItemEntity) => entity.id)),
      },
    })

    for (const entity of result) {
      debug('Deleting presentation definition entity', entity.id)
      await pdRepository.delete(entity.id)
    }
    return result.length
  }

  findIds = async (
    pdRepository: Repository<DcqlQueryItemEntity>,
    filter: Array<DcqlQueryItemFilter> | undefined,
  ): Promise<Array<DcqlQueryItemEntity>> => {
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

const cleanFilter = (filter: Array<DcqlQueryItemFilter> | undefined): Array<DcqlQueryItemFilter> | undefined => {
  if (filter === undefined) {
    return undefined
  }

  return filter.map((item) => {
    const cleanedItem: DcqlQueryItemFilter = {}
    for (const key in item) {
      const value = item[key as keyof DcqlQueryItemFilter]
      if (value !== undefined) {
        ;(cleanedItem as any)[key] = value
      }
    }
    return cleanedItem
  })
}
