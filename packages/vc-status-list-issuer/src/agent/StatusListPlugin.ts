import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import {
  createNewStatusList,
  CreateNewStatusListArgs,
  CredentialWithStatusSupport,
  GetStatusListArgs,
  IAddStatusToCredentialArgs,
  IAddStatusToSdJwtCredentialArgs,
  IRequiredContext,
  IRequiredPlugins,
  IStatusListPlugin,
  StatusListResult,
} from '@sphereon/ssi-sdk.vc-status-list'
import { getDriver, IStatusListDriver } from '@sphereon/ssi-sdk.vc-status-list-issuer-drivers'
import { Loggers, OrPromise } from '@sphereon/ssi-types'
import { IAgentContext, IAgentPlugin, IKeyManager } from '@veramo/core'
import { createStatusList, handleCredentialStatus, handleSdJwtCredentialStatus } from '../functions'
import { StatusListInstance } from '../types'
import { SdJwtVcPayload } from '@sd-jwt/sd-jwt-vc'
import { DataSource } from 'typeorm'

const logger = Loggers.DEFAULT.get('sphereon:ssi-sdk:vc-status-list')

export class StatusListPlugin implements IAgentPlugin {
  private readonly instances: Array<StatusListInstance> = new Array<StatusListInstance>()
  private readonly defaultStatusListId?: string
  private readonly allDataSources: DataSources

  private initialized: Boolean = false

  readonly methods: IStatusListPlugin = {
    slAddStatusToCredential: this.slAddStatusToCredential.bind(this),
    slAddStatusToSdJwtCredential: this.slAddStatusToSdJwtCredential.bind(this),
    slCreateStatusList: this.slCreateStatusList.bind(this),
    slGetStatusList: this.slGetStatusList.bind(this),
    slImportStatusLists: this.slImportStatusLists.bind(this),
  }

  constructor(opts: {
    instances?: Array<StatusListInstance>
      defaultStatusListId?: string
    allDataSources?: DataSources
    autoCreateInstances?: boolean
  }) {
    this.instances = opts.instances ?? []
    // TODO: Do we only want the instances configured, or do we also want to look them up from the DB
    const instanceId = opts.defaultStatusListId ?? opts.instances?.[0]?.id
    if (!instanceId) {
      logger.warning(
        `Could not deduce the default instance id from the status lists, so no default status list will be used. Please configure the default instance id in the agent configuration.`,
      )
    }
    this.defaultStatusListId = instanceId
    this.allDataSources = opts.allDataSources ?? DataSources.singleInstance()
  }

  private async init() {
    if (!this.initialized) {
      for (const dbName of this.allDataSources.getDbNames()) {
        const driver = await getDriver({ dbName, dataSources: this.allDataSources })
        const statusLists = await driver.getStatusLists()

        const instances = await Promise.all(
          statusLists.map((statusList) => {
            const dataSource = this.allDataSources.getDbConnection(dbName)
            return this.createStatusListInstance(statusList, dataSource, driver)
          }),
        )

        this.instances.push(...instances)
      }
      this.initialized = true
    }
  }

  private async slImportStatusLists(
    imports: Array<CreateNewStatusListArgs>,
    context: IAgentContext<IRequiredPlugins & IStatusListPlugin & IKeyManager>,
  ): Promise<boolean> {
    await this.init()

    for (const instanceImport of imports) {
      const dataSource = this.allDataSources.getDbConnection(instanceImport.dbName ?? 'default')
      await createStatusList(instanceImport, dataSource, context)
    }

    return true
  }

  private createStatusListInstance(statusList: StatusListResult, dataSource: OrPromise<DataSource>, driver: IStatusListDriver) {
    return {
      id: statusList.id,
      correlationId: statusList.correlationId,
      issuer: typeof statusList.issuer === 'string' ? statusList.issuer : statusList.issuer.id,
      dataSource: dataSource,
      driverOptions: driver.getOptions(),
      driverType: driver.getType(),
    } satisfies StatusListInstance
  }

  private async getDriverForStatusListOption(effectiveStatusListId: string, correlationId?: string) {
    let instance
    if (correlationId && correlationId.trim() !== '') {
      instance = this.instances.find((inst) => inst.correlationId === correlationId)
    } else {
      instance = this.instances.find((inst) => inst.id === effectiveStatusListId)
    }
    if (!instance) {
      throw Error(`Status list with identifier ${correlationId ?? effectiveStatusListId} is not managed by the status list plugin`)
    }
    if (!instance.dataSource && !instance.driverOptions?.dbName) {
      throw Error(`Either a datasource or dbName needs to be supplied`)
    }
    const dataSource = instance.dataSource ? await instance.dataSource : await this.allDataSources.getDbConnection(instance.driverOptions!.dbName!)
    const driver =
      correlationId && correlationId.trim() !== ''
        ? await getDriver({ dataSource, correlationId })
        : await getDriver({ dataSource, id: effectiveStatusListId })
    return driver
  }

  private async slGetStatusList(args: GetStatusListArgs): Promise<StatusListResult> {
    await this.init()

    const sl = this.instances.find((instance) => instance.id === args.id || instance.correlationId === args.correlationId)
    const dataSource = await this.selectDatasource({ dbName: args.dbName, dataSource: args.dataSource ?? sl?.dataSource, instance: sl })
    const driver = await getDriver({
      id: args.id ?? sl?.id,
      correlationId: args.correlationId ?? sl?.correlationId,
      dataSource,
    })
    return await driver.getStatusList()
  }

  private async selectDatasource(args: { dbName?: string; dataSource?: OrPromise<DataSource>; instance?: StatusListInstance }) {
    const dbName = args.dbName ?? this.allDataSources.getDbNames()[0]
    if (args?.dataSource) {
      return args.dataSource
    } else if (args.instance?.dataSource) {
      return args.instance.dataSource
    } else if (args.dbName) {
      return await this.allDataSources.getDbConnection(dbName)
    } else {
      return await this.allDataSources.getDbConnection(dbName)
    }
  }

  private async slCreateStatusList(
    args: CreateNewStatusListArgs,
    context: IAgentContext<IRequiredPlugins & IStatusListPlugin & IKeyManager>,
  ): Promise<StatusListResult> {
    await this.init()

    const sl = await createNewStatusList(args, context)
    const dataSource = await this.selectDatasource({ dbName: args.dbName, dataSource: args.dataSource })
    const driver = await getDriver({
      id: sl.id,
      correlationId: sl.correlationId,
      dataSource,
    })
    let statusListDetails: StatusListResult | undefined = undefined
    try {
      statusListDetails = await this.slGetStatusList(args)
    } catch (e) {
      // That is fine if there is no status list yet
    }
    if (statusListDetails && this.instances.find((instance) => instance.id === args.id || instance.correlationId === args.correlationId)) {
      return Promise.reject(Error(`Status list with id  ${args.id} or correlation id ${args.correlationId} already exists`))
    } else {
      statusListDetails = await driver.createStatusList({
        statusListCredential: sl.statusListCredential,
        correlationId: sl.correlationId,
      })
      this.instances.push(this.createStatusListInstance(statusListDetails, dataSource, driver))
    }

    return statusListDetails
  }

  /**
   * Adds status information to a credential by either:
   * 1. Using existing status ID from the credential if present
   * 2. Using provided status list options
   * 3. Falling back to the default status list ID
   *
   * @param args Contains credential and status options
   * @param context Required agent context
   * @returns Credential with added status information
   */
  private async slAddStatusToCredential(args: IAddStatusToCredentialArgs, context: IRequiredContext): Promise<CredentialWithStatusSupport> {
    const { credential, ...rest } = args
    logger.debug(`Adding status to credential ${credential.id ?? 'without ID'}`)

    await this.init()

    const credentialStatus = credential.credentialStatus
    if (credentialStatus && (!rest.statusLists || rest.statusLists.length == 0)) {
      let existingStatusId: string | undefined
      if (Array.isArray(credentialStatus)) {
        // This was implemented with VCDM v2.0 support, but the rest of the SDK is not ready for that, so ICredential.credentialStatus's array union is disabled for now
        for (const stat of credentialStatus) {
          if (stat.id && stat.id.trim() !== '') {
            existingStatusId = stat.id.split('#')[0]
            break
          }
        }
      } else if (credentialStatus.id && credentialStatus.id.trim() !== '') {
        existingStatusId = credentialStatus.id.split('#')[0]
      }

      if (existingStatusId) {
        logger.debug(`Using existing status ID ${existingStatusId} for credential ${credential.id ?? 'without ID'}`)
        const instance = this.instances.find((inst) => inst.id === existingStatusId)
        if (!instance) {
          throw Error(`Status list with id ${existingStatusId} is not managed by the status list plugin`)
        }
        if (!instance.dataSource && !instance.driverOptions?.dbName) {
          throw Error(`Either a datasource or dbName needs to be supplied`)
        }
        const credentialId = credential.id ?? rest.credentialId
        const dataSource = instance.dataSource
          ? await instance.dataSource
          : await this.allDataSources.getDbConnection(instance.driverOptions!.dbName!)
        const driver = await getDriver({ dataSource, id: existingStatusId })
        await handleCredentialStatus(credential, {
          ...rest,
          credentialId,
          statusLists: [{ statusListId: existingStatusId }],
          driver,
        })
        return credential
      }
    }

    const statusListOpts = rest.statusLists?.length ? rest.statusLists : []
    logger.debug(`Adding new status using ${statusListOpts.length} status list option(s)`)
    const credentialId = credential.id ?? rest.credentialId
    for (const opt of statusListOpts) {
      const effectiveStatusListId = opt.statusListId ?? this.defaultStatusListId
      if (!effectiveStatusListId) {
        return Promise.reject(
          Error(
            `No status list ID provided and no default status list ID configured. Please provide a status list ID or configure a default status list ID in the agent configuration.`,
          ),
        )
      }
      const driver = await this.getDriverForStatusListOption(effectiveStatusListId, opt.statusListCorrelationId)
      await handleCredentialStatus(credential, {
        ...rest,
        credentialId,
        statusLists: [
          {
            ...opt,
            statusListId: effectiveStatusListId,
          },
        ],
        driver,
      })
    }
    logger.debug(`Successfully added status information to credential ${credential.id ?? 'without ID'}`)
    return credential
  }

  /**
   * Adds status information to an SD-JWT credential by either:
   * 1. Using existing status URI from the credential if present
   * 2. Using provided status list options
   * 3. Falling back to the default status list ID
   *
   * @param args Contains SD-JWT credential and status options
   * @param context Required agent context
   * @returns SD-JWT credential with added status information
   */
  private async slAddStatusToSdJwtCredential(args: IAddStatusToSdJwtCredentialArgs, context: IRequiredContext): Promise<SdJwtVcPayload> {
    const { credential, ...rest } = args
    logger.debug(`Adding status to SD-JWT credential`)

    await this.init()

    const credentialStatus = credential.status
    if (credentialStatus && (!rest.statusLists || rest.statusLists.length == 0)) {
      let existingStatusUri: string | undefined
      if (credentialStatus.status_list && credentialStatus.status_list.uri && credentialStatus.status_list.uri.trim() !== '') {
        existingStatusUri = credentialStatus.status_list.uri
      }
      if (existingStatusUri) {
        logger.debug(`Using existing status URI ${existingStatusUri} for SD-JWT credential`)
        const driver = await this.getDriverForStatusListOption(existingStatusUri)
        await handleSdJwtCredentialStatus(credential, {
          ...rest,
          statusLists: [{ ...rest.statusLists, statusListId: existingStatusUri }],
          driver,
        })
        return credential
      }
    }

    const statusListOpts = rest.statusLists?.length ? rest.statusLists : []
    logger.info(`Adding new status using status list options with ID ${statusListOpts[0].statusListId ?? this.defaultStatusListId}`)
    const firstOpt = statusListOpts[0]
    const effectiveStatusListId = firstOpt.statusListId ?? this.defaultStatusListId
    if (!effectiveStatusListId) {
      return Promise.reject(
        Error(
          `No status list ID provided and no default status list ID configured. Please provide a status list ID or configure a default status list ID in the agent configuration.`,
        ),
      )
    }
    const driver = await this.getDriverForStatusListOption(effectiveStatusListId, firstOpt.statusListCorrelationId)
    await handleSdJwtCredentialStatus(credential, {
      ...rest,
      statusLists: [
        {
          ...firstOpt,
          statusListId: effectiveStatusListId,
        },
      ],
      driver,
    })
    logger.debug(`Successfully added status information to SD-JWT credential`)
    return credential
  }
}
