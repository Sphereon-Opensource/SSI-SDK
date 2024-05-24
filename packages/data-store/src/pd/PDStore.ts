import { OrPromise } from '@sphereon/ssi-types'
import { DataSource, In } from 'typeorm'
import { AbstractPdStore } from './AbstractPDStore'
import Debug from 'debug'
import { GetPDArgs, GetPDsArgs, DeletePDArgs, NonPersistedPresentationDefinitionItem, PresentationDefinitionItem } from '../types'
import { PresentationDefinitionItemEntity } from '../entities/presentationDefinitions/PresentationDefinitionItemEntity'
import { presentationDefinitionEntityItemFrom, presentationDefinitionItemFrom } from '../utils/presentationDefinitions/MappingUtils'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:pd-store')

export class PDStore extends AbstractPdStore {
  private readonly dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    super()
    this.dbConnection = dbConnection
  }

  getDefinition = async (args: GetPDArgs): Promise<PresentationDefinitionItem> => {
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

  getDefinitions = async (args: GetPDsArgs): Promise<Array<PresentationDefinitionItem>> => {
    const { filter } = args
    const pdRepository = (await this.dbConnection).getRepository(PresentationDefinitionItemEntity)
    const initialResult: Array<PresentationDefinitionItemEntity> = await pdRepository.find({
      ...(filter && { where: filter }),
    })

    const result: Array<PresentationDefinitionItemEntity> = await pdRepository.find({
      where: {
        id: In(initialResult.map((entity: PresentationDefinitionItemEntity) => entity.id)),
      },
    })

    return result.map((entity: PresentationDefinitionItemEntity) => presentationDefinitionItemFrom(entity))
  }

  addDefinition = async (item: NonPersistedPresentationDefinitionItem): Promise<PresentationDefinitionItem> => {
    const pdRepository = (await this.dbConnection).getRepository(PresentationDefinitionItemEntity)

    const entity: PresentationDefinitionItemEntity = presentationDefinitionEntityItemFrom(item)
    debug('Adding presentation definition item', item)
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
      return Promise.reject(Error(`No presentation definition item found for id: ${item.id}`))
    }

    const entity: PresentationDefinitionItemEntity = presentationDefinitionEntityItemFrom(item)
    debug('Updating presentation definition item', item)
    const updateResult: PresentationDefinitionItemEntity = await pdRepository.save(entity, {
      transaction: true,
    })

    return presentationDefinitionItemFrom(updateResult)
  }

  deleteDefinition = async (args: DeletePDArgs): Promise<void> => {
    const { itemId } = args

    const pdRepository = (await this.dbConnection).getRepository(PresentationDefinitionItemEntity)
    const entity: PresentationDefinitionItemEntity | null = await pdRepository.findOne({
      where: { id: itemId },
    })

    if (!entity) {
      return Promise.reject(Error(`No identity found for id: ${itemId}`))
    }

    debug('Removing presentation definition item ', entity)
    await pdRepository.delete(entity.id)
  }
}
