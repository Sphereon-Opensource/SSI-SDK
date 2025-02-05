import { IStatusListEntryEntity } from '@sphereon/ssi-sdk.data-store'
import {
  CredentialWithStatusSupport,
  IIssueCredentialStatusOpts,
  IRequiredPlugins,
  IStatusListPlugin,
  StatusListResult,
} from '@sphereon/ssi-sdk.vc-status-list'
import { getDriver, IStatusListDriver } from '@sphereon/ssi-sdk.vc-status-list-issuer-drivers'
import debug from 'debug'
import { SdJwtVcPayload } from '@sd-jwt/sd-jwt-vc'
import { Loggers, StatusListType, StatusPurpose2021 } from '@sphereon/ssi-types'
import { StatusListInstance } from './types'
import { IAgentContext } from '@veramo/core'

const logger = Loggers.DEFAULT.get('sphereon:ssi-sdk:vc-status-list-issuer')

async function processStatusListEntry(params: {
  statusListId: string
  statusList: Pick<StatusListResult, 'id' | 'correlationId'>
  credentialId?: string
  currentIndex: number
  opts?: IIssueCredentialStatusOpts
  slDriver: IStatusListDriver
  debugCredentialInfo: string
  useIndexCondition: (index: number) => boolean
  checkCredentialIdMismatch?: (existingEntry: IStatusListEntryEntity, credentialId: string, index: number) => void
  statusEntryCorrelationId?: string
}): Promise<{ statusListIndex: number; updateResult: any }> {
  let existingEntry: IStatusListEntryEntity | undefined = undefined
  // Search whether there is an existing status list entry for this credential first
  if (params.credentialId) {
    existingEntry = await params.slDriver.getStatusListEntryByCredentialId({
      statusListId: params.statusList.id,
      credentialId: params.credentialId,
      errorOnNotFound: false,
    })
    if (existingEntry) {
      debug(`Existing statusList entry and index ${existingEntry.statusListIndex} found for ${params.debugCredentialInfo}. Will reuse the index`)
    }
  }
  let statusListIndex = existingEntry?.statusListIndex ?? params.currentIndex
  if (params.useIndexCondition(statusListIndex)) {
    existingEntry = await params.slDriver.getStatusListEntryByIndex({
      statusListId: params.statusList.id,
      statusListIndex,
      errorOnNotFound: false,
    })
    debug(
      `${!existingEntry && 'no'} existing statusList entry and index ${existingEntry?.statusListIndex} for ${params.debugCredentialInfo}. Will reuse the index`,
    )
    if (
      existingEntry &&
      params.credentialId &&
      existingEntry.credentialId &&
      existingEntry.credentialId !== params.credentialId &&
      params.checkCredentialIdMismatch
    ) {
      params.checkCredentialIdMismatch(existingEntry, params.credentialId, statusListIndex)
    }
  } else {
    debug(`Will generate a new random statusListIndex since the credential did not contain a statusListIndex for ${params.debugCredentialInfo}...`)
    statusListIndex = await params.slDriver.getRandomNewStatusListIndex({
      correlationId: params.statusList.correlationId,
    })
    debug(`Random statusListIndex ${statusListIndex} assigned for ${params.debugCredentialInfo}`)
  }
  const updateArgs: any = {
    statusList: params.statusListId,
    statusListIndex,
    correlationId: params.statusEntryCorrelationId,
    value: params.opts?.value ?? 0,
  }
  if (params.credentialId) {
    updateArgs.credentialId = params.credentialId
  }
  const updateResult = await params.slDriver.updateStatusListEntry(updateArgs)
  return { statusListIndex, updateResult }
}

export const createStatusListFromInstance = async (
  args: {
    instance: StatusListInstance & { issuer: string; type?: StatusListType; statusPurpose?: StatusPurpose2021 }
  },
  context: IAgentContext<IRequiredPlugins & IStatusListPlugin>,
): Promise<StatusListResult> => {
  const instance = {
    ...args.instance,
    dataSource: args.instance.dataSource ? await args.instance.dataSource : undefined,
    type: args.instance.type ?? StatusListType.StatusList2021,
    statusPurpose: args.instance.statusPurpose ?? 'revocation',
    correlationId: args.instance.correlationId ?? args.instance.id,
  }
  let statusList: StatusListResult
  try {
    statusList = await context.agent.slGetStatusList(instance)
  } catch (e) {
    const id = instance.id
    const correlationId = instance.correlationId
    if (!id || !correlationId) {
      return Promise.reject(Error(`No correlation id and id provided for status list`))
    }
    statusList = await context.agent.slCreateStatusList({ ...instance, id, correlationId })
  }
  return statusList
}

/**
 * Adds status information to a credential using status list options from either:
 * - The provided options
 * - Existing credential status information
 *
 * The function updates each status list entry and modifies the credential's status.
 *
 * @param credential The credential to update with status information
 * @param credentialStatusOpts Options for status handling and driver configuration
 */
export const handleCredentialStatus = async (
  credential: CredentialWithStatusSupport,
  credentialStatusOpts?: IIssueCredentialStatusOpts & { driver?: IStatusListDriver },
): Promise<void> => {
  logger.debug(`Starting status update for credential ${credential.id ?? 'without ID'}`)

  const statusListOpts = [...(credentialStatusOpts?.statusListOpts ?? [])]
  if (statusListOpts.length === 0 && credential.credentialStatus) {
    if (Array.isArray(credential.credentialStatus)) {
      for (const credStatus of credential.credentialStatus) {
        if (credStatus.statusListCredential) {
          statusListOpts.push({
            statusListId: credStatus.statusListCredential,
            statusListIndex: credStatus.statusListIndex,
            statusListCorrelationId: (credStatus as any).statusListCorrelationId,
          })
        }
      }
    } else if (credential.credentialStatus.statusListCredential) {
      statusListOpts.push({
        statusListId: credential.credentialStatus.statusListCredential,
        statusListIndex: credential.credentialStatus.statusListIndex,
        statusListCorrelationId: (credential.credentialStatus as any).statusListCorrelationId,
      })
    }
  }
  if (!statusListOpts.length) {
    logger.debug('No status list options found, skipping update')
    return
  }
  const credentialId = credential.id ?? credentialStatusOpts?.credentialId
  for (const statusListOpt of statusListOpts) {
    const statusListId = statusListOpt.statusListId
    if (!statusListId) {
      logger.debug('Skipping status list option without ID')
      continue
    }

    logger.debug(`Processing status list ${statusListId} for credential ${credentialId ?? 'without ID'}`)
    const slDriver =
      credentialStatusOpts?.driver ??
      (await getDriver({
        id: statusListId,
        dataSource: credentialStatusOpts?.dataSource,
      }))
    const statusList = await slDriver.statusListStore.getStatusList({ id: statusListId })
    const currentIndex = statusListOpt.statusListIndex ?? 0
    const { updateResult } = await processStatusListEntry({
      statusListId,
      statusList,
      credentialId,
      currentIndex,
      statusEntryCorrelationId: statusListOpt.statusEntryCorrelationId,
      opts: credentialStatusOpts,
      slDriver,
      debugCredentialInfo: `credential with id ${credentialId} and statusListId ${statusListId}`,
      useIndexCondition: (index) => Boolean(index),
      checkCredentialIdMismatch: (existingEntry, credentialId, index) => {
        throw Error(
          `A credential with new id (${credentialId}) is issued, but its id does not match a registered statusListEntry id ${existingEntry.credentialId} for index ${index}`,
        )
      },
    })
    if (!credential.credentialStatus || Array.isArray(credential.credentialStatus)) {
      credential.credentialStatus = {
        id: `${statusListId}`,
        type: 'StatusList2021Entry',
        statusPurpose: 'revocation',
        statusListCredential: statusListId,
        ...updateResult.credentialStatus,
      }
    }
  }
  logger.debug(`Completed status updates for credential ${credentialId ?? 'without ID'}`)
}

/**
 * Adds status information to an SD-JWT credential using status list options from either:
 * - The provided options
 * - Existing credential status information
 *
 * Updates the credential's status field with status list URI and index.
 *
 * @param credential The SD-JWT credential to update
 * @param credentialStatusOpts Options for status handling and driver configuration
 * @throws Error if no status list options are available
 */
export const handleSdJwtCredentialStatus = async (
  credential: SdJwtVcPayload,
  credentialStatusOpts?: IIssueCredentialStatusOpts & { driver?: IStatusListDriver },
): Promise<void> => {
  logger.debug('Starting status update for SD-JWT credential')

  const statusListOpts = [...(credentialStatusOpts?.statusListOpts ?? [])]
  if (statusListOpts.length === 0 && credential.status?.status_list) {
    statusListOpts.push({
      statusListId: credential.status.status_list.uri,
      statusListIndex: credential.status.status_list.idx,
      statusListCorrelationId: (credential.status.status_list as any).statusListCorrelationId,
    })
  }

  if (!statusListOpts.length) {
    throw Error('No status list options available from credential or options')
  }

  for (const statusListOpt of statusListOpts) {
    const statusListId = statusListOpt.statusListId
    if (!statusListId) {
      logger.debug('Skipping status list option without ID')
      continue
    }

    logger.info(`Processing status list ${statusListId}`)
    const slDriver =
      credentialStatusOpts?.driver ??
      (await getDriver({
        id: statusListId,
        dataSource: credentialStatusOpts?.dataSource,
      }))
    const statusList = await slDriver.statusListStore.getStatusList({ id: statusListId })
    const currentIndex = statusListOpt.statusListIndex ?? 0
    const { statusListIndex } = await processStatusListEntry({
      statusListId,
      statusList,
      currentIndex,
      statusEntryCorrelationId: statusListOpt.statusEntryCorrelationId,
      opts: credentialStatusOpts,
      slDriver,
      debugCredentialInfo: `credential with statusListId ${statusListId}`,
      useIndexCondition: (index) => index > 0,
    })
    if (!credential.status) {
      credential.status = {
        status_list: {
          uri: statusListId,
          idx: statusListIndex,
        },
      }
    } else if (!credential.status.status_list) {
      credential.status.status_list = {
        uri: statusListId,
        idx: statusListIndex,
      }
    } else {
      credential.status.status_list = {
        uri: credential.status.status_list.uri || statusListId,
        idx: statusListIndex,
      }
    }
  }
  logger.debug('Completed SD-JWT credential status update')
}
