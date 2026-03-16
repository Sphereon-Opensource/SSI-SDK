import {
  AbstractCredentialDesignStore,
  AddCredentialDesignArgs,
  CredentialDesign,
  GetCredentialDesignArgs,
  GetCredentialDesignsArgs,
  RemoveCredentialDesignArgs,
  UpdateCredentialDesignArgs,
} from '@sphereon/ssi-sdk.data-store-types'
import { OrPromise } from '@sphereon/ssi-types'
import Debug from 'debug'
import { DataSource, Repository } from 'typeorm'
import { MetaDataSetEntity } from '../entities/credentialDesign'

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
    const results = await repo.find()
    return results.map((entity) => this.metaDataSetToCredentialDesign(entity))
  }

  addCredentialDesign = async (args: AddCredentialDesignArgs): Promise<CredentialDesign> => {
    debug('addCredentialDesign', args)
    const repo: Repository<MetaDataSetEntity> = (await this.dbConnection).getRepository(MetaDataSetEntity)

    const metaDataSet = new MetaDataSetEntity()
    metaDataSet.name = (args as any).name ?? 'default'
    metaDataSet.tenantId = (args as any).tenantId
    metaDataSet.metaDataKeys = []
    metaDataSet.schemaDefinitions = []

    const saved = await repo.save(metaDataSet)
    return this.metaDataSetToCredentialDesign(saved)
  }

  updateCredentialDesign = async (args: UpdateCredentialDesignArgs): Promise<CredentialDesign> => {
    debug('updateCredentialDesign', args)
    const repo: Repository<MetaDataSetEntity> = (await this.dbConnection).getRepository(MetaDataSetEntity)
    const existing = await repo.findOne({
      where: { id: (args as any).credentialDesignId },
    })

    if (!existing) {
      return Promise.reject(Error(`No credential design found for id: ${(args as any).credentialDesignId}`))
    }

    if ((args as any).name !== undefined) {
      existing.name = (args as any).name
    }

    const saved = await repo.save(existing)
    return this.metaDataSetToCredentialDesign(saved)
  }

  removeCredentialDesign = async (args: RemoveCredentialDesignArgs): Promise<void> => {
    debug('removeCredentialDesign', args)
    const repo: Repository<MetaDataSetEntity> = (await this.dbConnection).getRepository(MetaDataSetEntity)
    const existing = await repo.findOne({
      where: { id: (args as any).credentialDesignId },
    })

    if (!existing) {
      return Promise.reject(Error(`No credential design found for id: ${(args as any).credentialDesignId}`))
    }

    await repo.remove(existing)
  }

  private metaDataSetToCredentialDesign(entity: MetaDataSetEntity): CredentialDesign {
    return {
      label: entity.name,
    }
  }
}
