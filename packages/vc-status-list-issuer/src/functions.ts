import { IStatusListEntryEntity } from '@sphereon/ssi-sdk.data-store'
import {
  CredentialWithStatusSupport,
  IIssueCredentialStatusOpts,
  IRequiredPlugins,
  IStatusListPlugin,
  StatusListResult,
} from '@sphereon/ssi-sdk.vc-status-list'
import { getDriver, IStatusListDriver } from '@sphereon/ssi-sdk.vc-status-list-issuer-drivers'
import { StatusListType, StatusPurpose2021 } from '@sphereon/ssi-types'
import { IAgentContext } from '@veramo/core'
import debug from 'debug'
import { StatusListInstance } from './types'
import { SdJwtVcPayload } from '@sd-jwt/sd-jwt-vc'

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
    correlationId: params.opts?.statusEntryCorrelationId,
    value: params.opts?.value,
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

export const handleCredentialStatus = async (
  credential: CredentialWithStatusSupport,
  credentialStatusOpts?: IIssueCredentialStatusOpts & {
    driver?: IStatusListDriver
  },
): Promise<void> => {
  if (credential.credentialStatus) {
    const credentialId = credential.id ?? credentialStatusOpts?.credentialId
    const statusListId = credential.credentialStatus.statusListCredential ?? credentialStatusOpts?.statusListId
    debug(`Creating new credentialStatus object for credential with id ${credentialId} and statusListId ${statusListId}...`)
    if (!statusListId) {
      throw Error(
        `A credential status is requested, but we could not determine the status list id from 'statusListCredential' value or configuration`,
      )
    }

    const slDriver =
      credentialStatusOpts?.driver ??
      (await getDriver({
        id: statusListId,
        dataSource: credentialStatusOpts?.dataSource,
      }))
    const statusList = await slDriver.statusListStore.getStatusList({ id: statusListId })

    // Search whether there is an existing status list entry for this credential first
    const currentIndex = credential.credentialStatus.statusListIndex ?? credentialStatusOpts?.statusListIndex ?? 0
    const { statusListIndex, updateResult } = await processStatusListEntry({
      statusListId,
      statusList,
      credentialId,
      currentIndex,
      opts: credentialStatusOpts,
      slDriver,
      debugCredentialInfo: `credential with id ${credentialId} and statusListId ${statusListId}`,
      useIndexCondition: (index) => Boolean(index),
      checkCredentialIdMismatch: (existingEntry, credentialId, index) => {
        throw Error(
          `A credential with new id (${credentialId}) is issued, but its id does not match a registered statusListEntry id ${existingEntry.credentialId} for index ${index} `,
        )
      },
    })

    debug(`StatusListEntry with statusListIndex ${statusListIndex} created for credential with id ${credentialId} and statusListId ${statusListId}`)

    credential.credentialStatus = {
      ...credential.credentialStatus,
      ...updateResult.credentialStatus,
    }
  }
}
export const handleSdJwtCredentialStatus = async (
  credential: SdJwtVcPayload,
  credentialStatusOpts?: IIssueCredentialStatusOpts & {
    driver?: IStatusListDriver
  },
): Promise<void> => {
  if (credential.status) {
    const statusListId = credential.status.status_list.uri ?? credentialStatusOpts?.statusListId
    debug(`Creating new credentialStatus object for credential with statusListId ${statusListId}...`)
    if (!statusListId) {
      throw Error(
        `A credential status is requested, but we could not determine the status list id from 'statusListCredential' value or configuration`,
      )
    }

    const slDriver =
      credentialStatusOpts?.driver ??
      (await getDriver({
        id: statusListId,
        dataSource: credentialStatusOpts?.dataSource,
      }))
    const statusList = await slDriver.statusListStore.getStatusList({ id: statusListId })

    const currentIndex =
      typeof credentialStatusOpts?.statusListIndex === 'string'
        ? parseInt(credentialStatusOpts.statusListIndex, 10)
        : (credentialStatusOpts?.statusListIndex ?? -1)
    const initialIndex = credential.status?.status_list?.idx ?? currentIndex
    const { statusListIndex } = await processStatusListEntry({
      statusListId,
      statusList,
      currentIndex: initialIndex,
      opts: credentialStatusOpts,
      slDriver,
      debugCredentialInfo: `credential with statusListId ${statusListId}`,
      useIndexCondition: (index) => index > 0,
    })

    debug(`StatusListEntry with statusListIndex ${statusListIndex} created for credential with statusListId ${statusListId}`)

    credential.status.status_list.idx = statusListIndex
  }
}
