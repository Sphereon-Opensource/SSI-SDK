import type { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { CredentialMapper, type CredentialProofFormat, type StatusListCredential, StatusListType, type StatusPurpose2021 } from '@sphereon/ssi-types'
import type { CredentialStatus, DIDDocument, IAgentContext, ProofFormat as VeramoProofFormat } from '@veramo/core'

import {
  BitstringStatusListEntryCredentialStatus,
  IBitstringStatusListEntryEntity,
  IStatusListEntryEntity,
  StatusListEntity,
} from '@sphereon/ssi-sdk.data-store'

import { checkStatus } from '@sphereon/vc-status-list'

// @ts-ignore
import { CredentialJwtOrJSON, StatusMethod } from 'credential-status'
import {
  CreateNewStatusListFuncArgs,
  IMergeDetailsWithEntityArgs,
  IToDetailsFromCredentialArgs,
  Status2021,
  StatusList2021EntryCredentialStatus,
  StatusList2021ToVerifiableCredentialArgs,
  StatusListOAuthEntryCredentialStatus,
  StatusListResult,
  StatusOAuth,
  UpdateStatusListFromEncodedListArgs,
  UpdateStatusListIndexArgs,
} from './types'
import { assertValidProofType, determineStatusListType, getAssertedValue, getAssertedValues } from './utils'
import { getStatusListImplementation } from './impl/StatusListFactory'
import { IVcdmCredentialPlugin } from '@sphereon/ssi-sdk.credential-vcdm'
import {
  IBitstringStatusListImplementationResult,
  IExtractedCredentialDetails,
  IOAuthStatusListImplementationResult,
  IStatusList2021ImplementationResult,
} from './impl/IStatusList'

/**
 * Fetches a status list credential from a URL
 * @param args - Object containing the status list credential URL
 * @returns Promise resolving to the fetched StatusListCredential
 */
export async function fetchStatusListCredential(args: { statusListCredential: string }): Promise<StatusListCredential> {
  const url = getAssertedValue('statusListCredential', args.statusListCredential)
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw Error(`Fetching status list ${url} resulted in an error: ${response.status} : ${response.statusText}`)
    }
    const responseAsText = await response.text()
    if (responseAsText.trim().startsWith('{')) {
      return JSON.parse(responseAsText) as StatusListCredential
    }
    return responseAsText as StatusListCredential
  } catch (error) {
    console.error(`Fetching status list ${url} resulted in an unexpected error: ${error instanceof Error ? error.message : JSON.stringify(error)}`)
    throw error
  }
}

/**
 * Creates a status checking function for credential-status plugin
 * @param args - Configuration options for status verification
 * @returns StatusMethod function for checking credential status
 */
export function statusPluginStatusFunction(args: {
  documentLoader: any
  suite: any
  mandatoryCredentialStatus?: boolean
  verifyStatusListCredential?: boolean
  verifyMatchingIssuers?: boolean
  errorUnknownListType?: boolean
}): StatusMethod {
  return async (credential: CredentialJwtOrJSON, didDoc: DIDDocument): Promise<CredentialStatus> => {
    const result = await checkStatusForCredential({
      ...args,
      documentLoader: args.documentLoader,
      credential: credential as StatusListCredential,
      errorUnknownListType: args.errorUnknownListType,
    })

    return {
      revoked: !result.verified || result.error,
      ...(result.error && { error: result.error }),
    }
  }
}

/**
 * Function that can be used together with @digitalbazar/vc and @digitialcredentials/vc
 * @param args - Configuration options for status verification
 * @returns Function for checking credential status
 */
export function vcLibCheckStatusFunction(args: {
  mandatoryCredentialStatus?: boolean
  verifyStatusListCredential?: boolean
  verifyMatchingIssuers?: boolean
  errorUnknownListType?: boolean
}) {
  const { mandatoryCredentialStatus, verifyStatusListCredential, verifyMatchingIssuers, errorUnknownListType } = args
  return (args: {
    credential: StatusListCredential
    documentLoader: any
    suite: any
  }): Promise<{
    verified: boolean
    error?: any
  }> => {
    return checkStatusForCredential({
      ...args,
      mandatoryCredentialStatus,
      verifyStatusListCredential,
      verifyMatchingIssuers,
      errorUnknownListType,
    })
  }
}

/**
 * Checks the status of a credential using its credential status information
 * @param args - Parameters for credential status verification
 * @returns Promise resolving to verification result with error details if any
 */
export async function checkStatusForCredential(args: {
  credential: StatusListCredential
  documentLoader: any
  suite: any
  mandatoryCredentialStatus?: boolean
  verifyStatusListCredential?: boolean
  verifyMatchingIssuers?: boolean
  errorUnknownListType?: boolean
}): Promise<{ verified: boolean; error?: any }> {
  const verifyStatusListCredential = args.verifyStatusListCredential ?? true
  const verifyMatchingIssuers = args.verifyMatchingIssuers ?? true
  const uniform = CredentialMapper.toUniformCredential(args.credential)
  if (!('credentialStatus' in uniform) || !uniform.credentialStatus) {
    if (args.mandatoryCredentialStatus) {
      const error = 'No credential status object found in the Verifiable Credential and it is mandatory'
      console.log(error)
      return { verified: false, error }
    }
    return { verified: true }
  }
  if ('credentialStatus' in uniform && uniform.credentialStatus) {
    if (uniform.credentialStatus.type === 'StatusList2021Entry' || uniform.credentialStatus.type === 'BitstringStatusListEntry') {
      return checkStatus({ ...args, verifyStatusListCredential, verifyMatchingIssuers })
    } else if (args?.errorUnknownListType) {
      const error = `Credential status type ${uniform.credentialStatus.type} is not supported, and check status has been configured to not allow for that`
      console.log(error)
      return { verified: false, error }
    } else {
      console.log(`Skipped verification of status type ${uniform.credentialStatus.type} as we do not support it (yet)`)
    }
  }
  return { verified: true }
}

export async function simpleCheckStatusFromStatusListUrl(args: {
  statusListCredential: string
  statusPurpose?: StatusPurpose2021
  type?: StatusListType | 'StatusList2021Entry'
  id?: string
  statusListIndex: string
}): Promise<number | Status2021 | StatusOAuth> {
  return checkStatusIndexFromStatusListCredential({
    ...args,
    statusListCredential: await fetchStatusListCredential(args),
  })
}

/**
 * Checks the status at a specific index in a status list credential
 * @param args - Parameters including credential and index to check
 * @returns Promise resolving to status value at the specified index
 */
export async function checkStatusIndexFromStatusListCredential(args: {
  statusListCredential: StatusListCredential
  statusPurpose?: StatusPurpose2021 | string | string[]
  type?: StatusListType | 'StatusList2021Entry' | 'BitstringStatusListEntry'
  id?: string
  statusListIndex: string | number
  bitsPerStatus?: number
}): Promise<number | Status2021 | StatusOAuth> {
  const statusListType: StatusListType = determineStatusListType(args.statusListCredential)
  const implementation = getStatusListImplementation(statusListType)
  return implementation.checkStatusIndex(args)
}

export async function createNewStatusList(
  args: CreateNewStatusListFuncArgs,
  context: IAgentContext<(IVcdmCredentialPlugin | any) /*IvcdMCredentialPlugin is not available*/ & IIdentifierResolution>,
): Promise<StatusListResult> {
  const { type } = getAssertedValues(args)
  const implementation = getStatusListImplementation(type)
  return implementation.createNewStatusList(args, context)
}

/**
 * Updates a status index in a status list credential
 * @param args - Parameters for status update including credential and new value
 * @param context - Agent context with required plugins
 * @returns Promise resolving to updated status list details
 */
export async function updateStatusIndexFromStatusListCredential(
  args: UpdateStatusListIndexArgs,
  context: IAgentContext<IVcdmCredentialPlugin & IIdentifierResolution>,
): Promise<StatusListResult> {
  const credential = getAssertedValue('statusListCredential', args.statusListCredential)
  const statusListType: StatusListType = determineStatusListType(credential)
  const implementation = getStatusListImplementation(statusListType)
  return implementation.updateStatusListIndex(args, context)
}

/**
 * Extracts credential details from a status list credential
 * @param statusListCredential - The status list credential to extract from
 * @returns Promise resolving to extracted credential details
 */
export async function extractCredentialDetails(statusListCredential: StatusListCredential): Promise<IExtractedCredentialDetails> {
  const statusListType = determineStatusListType(statusListCredential)
  const implementation = getStatusListImplementation(statusListType)
  return implementation.extractCredentialDetails(statusListCredential)
}

export async function toStatusListDetails(
  args: IToDetailsFromCredentialArgs,
): Promise<StatusListResult & (IStatusList2021ImplementationResult | IOAuthStatusListImplementationResult | IBitstringStatusListImplementationResult)>

export async function toStatusListDetails(
  args: IMergeDetailsWithEntityArgs,
): Promise<StatusListResult & (IStatusList2021ImplementationResult | IOAuthStatusListImplementationResult | IBitstringStatusListImplementationResult)>

/**
 * Converts credential and metadata into detailed status list information
 * Handles both CREATE/READ and UPDATE contexts based on input arguments
 * @param args - Either credential-based args or entity-based args for merging
 * @returns Promise resolving to complete status list details
 */
export async function toStatusListDetails(
  args: IToDetailsFromCredentialArgs | IMergeDetailsWithEntityArgs,
): Promise<
  StatusListResult & (IStatusList2021ImplementationResult | IOAuthStatusListImplementationResult | IBitstringStatusListImplementationResult)
> {
  if ('statusListCredential' in args) {
    // CREATE/READ context
    const statusListType = args.statusListType
    const implementation = getStatusListImplementation(statusListType)
    return implementation.toStatusListDetails(args)
  } else {
    // UPDATE context
    const statusListType = args.statusListEntity.type
    const implementation = getStatusListImplementation(statusListType)
    return implementation.toStatusListDetails(args)
  }
}

/**
 * Creates a credential status object from status list and entry information
 * @param args - Parameters including status list, entry, and index
 * @returns Promise resolving to appropriate credential status type
 */
export async function createCredentialStatusFromStatusList(args: {
  statusList: StatusListEntity
  statusListEntry: IStatusListEntryEntity | IBitstringStatusListEntryEntity
  statusListIndex: number
}): Promise<StatusList2021EntryCredentialStatus | StatusListOAuthEntryCredentialStatus | BitstringStatusListEntryCredentialStatus> {
  const { statusList, statusListEntry, statusListIndex } = args

  // Determine the status list type and delegate to appropriate implementation
  const statusListType = determineStatusListType(statusList.statusListCredential!)
  const implementation = getStatusListImplementation(statusListType)

  // Each implementation should have a method to create credential status
  return implementation.createCredentialStatus({
    statusList,
    statusListEntry,
    statusListIndex,
  })
}

/**
 * Updates a status list using a base64 encoded list of statuses
 * @param args - Parameters including encoded list and update details
 * @param context - Agent context with required plugins
 * @returns Promise resolving to updated status list details
 */
export async function updateStatusListIndexFromEncodedList(
  args: UpdateStatusListFromEncodedListArgs,
  context: IAgentContext<IVcdmCredentialPlugin & IIdentifierResolution>,
): Promise<StatusListResult> {
  const { type } = getAssertedValue('type', args)
  const implementation = getStatusListImplementation(type!)
  return implementation.updateStatusListFromEncodedList(args, context)
}

/**
 * Converts a StatusList2021 to a verifiable credential
 * @param args - Parameters for credential creation including issuer and encoded list
 * @param context - Agent context with required plugins
 * @returns Promise resolving to signed status list credential
 */
export async function statusList2021ToVerifiableCredential(
  args: StatusList2021ToVerifiableCredentialArgs,
  context: IAgentContext<IVcdmCredentialPlugin & IIdentifierResolution>,
): Promise<StatusListCredential> {
  const { issuer, id, type } = getAssertedValues(args)
  const identifier = await context.agent.identifierManagedGet({
    identifier: typeof issuer === 'string' ? issuer : issuer.id,
    vmRelationship: 'assertionMethod',
    offlineWhenNoDIDRegistered: true, // FIXME Fix identifier resolution for EBSI
  })
  const proofFormat: CredentialProofFormat = args?.proofFormat ?? 'lds'
  assertValidProofType(StatusListType.StatusList2021, proofFormat)
  const veramoProofFormat: VeramoProofFormat = proofFormat as VeramoProofFormat

  const encodedList = getAssertedValue('encodedList', args.encodedList)
  const statusPurpose = getAssertedValue('statusPurpose', args.statusPurpose)
  const credential = {
    '@context': ['https://www.w3.org/2018/credentials/v1', 'https://w3id.org/vc/status-list/2021/v1'],
    id,
    issuer,
    // issuanceDate: "2021-03-10T04:24:12.164Z",
    type: ['VerifiableCredential', `${type}Credential`],
    credentialSubject: {
      id,
      type,
      statusPurpose,
      encodedList,
    },
  }
  // TODO copy statuslist schema to local and disable fetching remote contexts
  const verifiableCredential = await context.agent.createVerifiableCredential({
    credential,
    keyRef: identifier.kmsKeyRef,
    proofFormat: veramoProofFormat,
    fetchRemoteContexts: true,
  })

  return CredentialMapper.toWrappedVerifiableCredential(verifiableCredential as StatusListCredential).original as StatusListCredential
}
