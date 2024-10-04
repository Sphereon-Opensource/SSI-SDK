import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import {
  createNewStatusList,
  CreateNewStatusListArgs,
  CredentialWithStatusSupport,
  GetStatusListArgs,
  IAddStatusToCredentialArgs,
  IRequiredContext,
  IRequiredPlugins,
  IStatusListPlugin,
  StatusListDetails
} from '@sphereon/ssi-sdk.vc-status-list'
import { getDriver } from '@sphereon/ssi-sdk.vc-status-list-issuer-drivers'
import { Loggers } from '@sphereon/ssi-types'
import { IAgentContext, IAgentPlugin } from '@veramo/core'
import { createStatusListFromInstance, handleCredentialStatus } from '../functions'
import { StatusListInstance } from '../types'

const logger = Loggers.DEFAULT.get('sphereon:ssi-sdk:vc-status-list')

export class StatusListPlugin implements IAgentPlugin {
  // readonly schema = schema.IDidAuthSiopOpAuthenticator
  private readonly instances: Array<StatusListInstance> = []
  private readonly defaultStatusListId: string
  private readonly autoCreateInstances: boolean
  private readonly allDataSources: DataSources
  readonly methods: IStatusListPlugin = {
    slAddStatusToCredential: this.slAddStatusToCredential.bind(this),
    slCreateStatusList: this.slCreateStatusList.bind(this),
    slGetStatusList: this.slGetStatusList.bind(this)
  }


  constructor(opts: {
    instances: Array<StatusListInstance>,
    defaultInstanceId?: string,
    allDataSources?: DataSources
    autoCreateInstances?: boolean
  }) {
    this.instances = opts.instances
    // TODO: Do we only want the instances configured, or do we also want to look them up from the DB
    const instanceId = opts.defaultInstanceId ?? opts.instances[0].id
    if (!instanceId) {
      throw Error(`Could not deduce the default instance id from the status lists`)
    }
    this.defaultStatusListId = instanceId
    this.allDataSources = opts.allDataSources ?? DataSources.singleInstance()
    this.autoCreateInstances = opts.autoCreateInstances ?? true
  }

  private async slGetStatusList(args: GetStatusListArgs, context: IAgentContext<IRequiredPlugins & IStatusListPlugin>): Promise<StatusListDetails> {
    const sl = this.instances.find((instance) => instance.id === args.id || instance.correlationId === args.correlationId)
    const dataSource = sl?.dataSource ?? args?.dataSource ? await args.dataSource : args.dbName ? await this.allDataSources.getDbConnection(args.dbName) : await this.allDataSources.getDbConnection(this.allDataSources.getDbNames()[0])
    try {
      const driver = await getDriver({
        id: args.id ?? sl?.id,
        correlationId: args.correlationId ?? sl?.correlationId,
        dataSource
      })
      return await driver.getStatusList()
    } catch (e) {
      const issuer = sl?.issuer
      if (this.autoCreateInstances && sl && issuer) {
        return await createStatusListFromInstance({ instance: { ...sl, issuer } }, context)
      }
      throw e
    }
  }

  private async slCreateStatusList(args: CreateNewStatusListArgs, context: IAgentContext<IRequiredPlugins & IStatusListPlugin>): Promise<StatusListDetails> {

    const sl = await createNewStatusList(args, context)
    const dataSource = args?.dataSource ? await args.dataSource : args.dbName ? await this.allDataSources.getDbConnection(args.dbName) : await this.allDataSources.getDbConnection(this.allDataSources.getDbNames()[0])
    const driver = await getDriver({
      id: sl.id,
      correlationId: sl.correlationId,
      dataSource
    })
    let statusListDetails: StatusListDetails | undefined = undefined
    try {
      statusListDetails = await this.slGetStatusList(args, context)
    } catch (e) {
      // That is fine if there is no status list yet
    }
    if (statusListDetails && this.instances.find(sl => sl.id === args.id || sl.correlationId === args.correlationId)) {
      return Promise.reject(Error(`Status list with id  ${args.id} or correlation id ${args.correlationId} already exists`))
    } else {
      statusListDetails = await driver.createStatusList({
        statusListCredential: sl.statusListCredential,
        correlationId: sl.correlationId
      })
      this.instances.push({
        correlationId: statusListDetails.correlationId,
        id: statusListDetails.id,
        dataSource,
        driverType: statusListDetails.driverType!,
        driverOptions: driver.getOptions()
      })
    }


    return statusListDetails

  }

  private async slAddStatusToCredential(args: IAddStatusToCredentialArgs, context: IRequiredContext): Promise<CredentialWithStatusSupport> {
    const { credential, ...rest } = args
    const credentialStatus = credential.credentialStatus
    if (!credentialStatus) {
      logger.info(`Not adding status list info, since no credentialStatus object was present in the credential`)
      return Promise.resolve(credential)
    }
    // If the credential is already providing the id we favor that over the argument. Default status list as a fallback. We also allow passing in an empty id to get the default
    const credentialStatusId = credentialStatus.id && credentialStatus.id.trim() !== '' ? credentialStatus.id.split('#')[0] : undefined
    const statusListId = credentialStatus.statusListCredential ?? credentialStatusId ?? args.statusListId ?? this.defaultStatusListId
    const instance = this.instances.find(instance => instance.id === statusListId)
    if (!instance) {
      return Promise.reject(Error(`Status list with id ${statusListId} is not managed by the status list plugin`))
    } else if (!instance.dataSource && !instance.driverOptions?.dbName) {
      return Promise.reject(Error(`Either a datasource or dbName needs to be supplied`))
    }
    const credentialId = credential.id ?? args.credentialId
    const dataSource = instance.dataSource ? await instance.dataSource : await this.allDataSources.getDbConnection(instance.driverOptions!.dbName!)
    await handleCredentialStatus(credential, {
      ...rest,
      credentialId,
      statusListId,
      driver: await getDriver({ dataSource, id: statusListId })
    })
    return credential
  }
}


