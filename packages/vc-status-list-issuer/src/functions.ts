import { IStatusListEntryEntity } from '@sphereon/ssi-sdk.data-store'
import {
  CredentialWithStatusSupport,
  IIssueCredentialStatusOpts,
  IRequiredPlugins,
  IStatusListPlugin,
  StatusListDetails
} from '@sphereon/ssi-sdk.vc-status-list'
import { getDriver, IStatusListDriver } from '@sphereon/ssi-sdk.vc-status-list-issuer-drivers'
import { StatusListCredentialIdMode, StatusListType, StatusPurpose2021 } from '@sphereon/ssi-types'
import { IAgentContext } from '@veramo/core'
import debug from 'debug'
import { StatusListInstance } from './types'

export const createStatusListFromInstance = async (args: {
  instance: StatusListInstance & { issuer: string, type?: StatusListType, statusPurpose?: StatusPurpose2021 }
}, context: IAgentContext<IRequiredPlugins & IStatusListPlugin>): Promise<StatusListDetails> => {
  const instance = {
    ...args.instance,
    dataSource: args.instance.dataSource ? await (args.instance.dataSource) : undefined,
    type: args.instance.type ?? StatusListType.StatusList2021,
    statusPurpose: args.instance.statusPurpose ?? 'revocation',
    correlationId: args.instance.correlationId ?? args.instance.id
  }
  let sl: StatusListDetails
  try {
    sl = await context.agent.slGetStatusList(instance)
  } catch (e) {
    const id = instance.id
    const correlationId = instance.correlationId
    if (!id || !correlationId) {
      return Promise.reject(Error(`No correlation id and id provided for status list`))
    }
    sl = await context.agent.slCreateStatusList({...instance, id, correlationId})
  }
  return sl
}

export const handleCredentialStatus = async (credential: CredentialWithStatusSupport, credentialStatusOpts?: IIssueCredentialStatusOpts & {
  driver?: IStatusListDriver
}): Promise<void> => {
  if (credential.credentialStatus) {
    const credentialId = credential.id ?? credentialStatusOpts?.credentialId
    const statusListId = credential.credentialStatus.statusListCredential ?? credentialStatusOpts?.statusListId
    debug(`Creating new credentialStatus object for credential with id ${credentialId} and statusListId ${statusListId}...`)
    if (!statusListId) {
      throw Error(
        `A credential status is requested, but we could not determine the status list id from 'statusListCredential' value or configuration`
      )
    }

    const slDriver = credentialStatusOpts?.driver ?? await getDriver({
      id: statusListId,
      dataSource: credentialStatusOpts?.dataSource
    })
    const statusList = await slDriver.statusListStore.getStatusList({ id: statusListId })

    if (!credentialId && statusList.credentialIdMode === StatusListCredentialIdMode.ISSUANCE) {
      throw Error(
        'No credential.id was provided in the credential, whilst the issuer is configured to persist credentialIds. Please adjust your input credential to contain an id'
      )
    }
    let existingEntry: IStatusListEntryEntity | undefined = undefined
    // Search whether there is an existing status list entry for this credential first
    if (credentialId) {
      existingEntry = await slDriver.getStatusListEntryByCredentialId({
        statusListId: statusList.id,
        credentialId,
        errorOnNotFound: false
      })
      if (existingEntry) {
        debug(
          `Existing statusList entry and index ${existingEntry?.statusListIndex} found for credential with id ${credentialId} and statusListId ${statusListId}. Will reuse the index`
        )
      }
    }
    let statusListIndex = existingEntry?.statusListIndex ?? credential.credentialStatus.statusListIndex ?? credentialStatusOpts?.statusListIndex
    if (statusListIndex) {
      existingEntry = await slDriver.getStatusListEntryByIndex({
        statusListId: statusList.id,
        statusListIndex,
        errorOnNotFound: false
      })
      debug(
        `${!existingEntry && 'no'} existing statusList entry and index ${
          existingEntry?.statusListIndex
        } for credential with id ${credentialId} and statusListId ${statusListId}. Will reuse the index`
      )
      if (existingEntry && credentialId && existingEntry.credentialId && existingEntry.credentialId !== credentialId) {
        throw Error(
          `A credential with new id (${credentialId}) is issued, but its id does not match a registered statusListEntry id ${existingEntry.credentialId} for index ${statusListIndex} `
        )
      }
    } else {
      debug(
        `Will generate a new random statusListIndex since the credential did not contain a statusListIndex for credential with id ${credentialId} and statusListId ${statusListId}...`
      )
      statusListIndex = await slDriver.getRandomNewStatusListIndex({ correlationId: statusList.correlationId })
      debug(`Random statusListIndex ${statusListIndex} assigned for credential with id ${credentialId} and statusListId ${statusListId}`)
    }
    const result = await slDriver.updateStatusListEntry({
      statusList: statusListId,
      credentialId,
      statusListIndex,
      correlationId: credentialStatusOpts?.statusEntryCorrelationId,
      value: credentialStatusOpts?.value
    })
    debug(`StatusListEntry with statusListIndex ${statusListIndex} created for credential with id ${credentialId} and statusListId ${statusListId}`)

    credential.credentialStatus = {
      ...credential.credentialStatus,
      ...result.credentialStatus
    }
  }
}
