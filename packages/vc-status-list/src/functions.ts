import type { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import {
  CredentialMapper,
  DocumentFormat,
  type CredentialProofFormat,
  type StatusListCredential,
  StatusListDriverType,
  StatusListType,
  type StatusPurpose2021,
} from '@sphereon/ssi-types'
import type { CredentialStatus, DIDDocument, IAgentContext, ICredentialPlugin, ProofFormat as VeramoProofFormat } from '@veramo/core'

import { checkStatus } from '@sphereon/vc-status-list'

// @ts-ignore
import { CredentialJwtOrJSON, StatusMethod } from 'credential-status'
import {
  CreateNewStatusListFuncArgs,
  Status2021,
  StatusList2021ToVerifiableCredentialArgs,
  StatusListResult,
  StatusOAuth,
  UpdateStatusListFromEncodedListArgs,
  UpdateStatusListIndexArgs,
} from './types'
import { assertValidProofType, determineStatusListType, getAssertedValue, getAssertedValues } from './utils'
import { getStatusListImplementation } from './impl/StatusListFactory'

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
 * @param args
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
    if (uniform.credentialStatus.type === 'StatusList2021Entry') {
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

export async function checkStatusIndexFromStatusListCredential(args: {
  statusListCredential: StatusListCredential
  statusPurpose?: StatusPurpose2021
  type?: StatusListType | 'StatusList2021Entry'
  id?: string
  statusListIndex: string | number
}): Promise<number | Status2021 | StatusOAuth> {
  const statusListType: StatusListType = determineStatusListType(args.statusListCredential)
  const implementation = getStatusListImplementation(statusListType)
  return implementation.checkStatusIndex(args)
}

export async function createNewStatusList(
  args: CreateNewStatusListFuncArgs,
  context: IAgentContext<(ICredentialPlugin | any) /*IvcdMCredentialPlugin is not available*/ & IIdentifierResolution>,
): Promise<StatusListResult> {
  const { type } = getAssertedValues(args)
  const implementation = getStatusListImplementation(type)
  return implementation.createNewStatusList(args, context)
}

export async function updateStatusIndexFromStatusListCredential(
  args: UpdateStatusListIndexArgs,
  context: IAgentContext<ICredentialPlugin & IIdentifierResolution>,
): Promise<StatusListResult> {
  const credential = getAssertedValue('statusListCredential', args.statusListCredential)
  const statusListType: StatusListType = determineStatusListType(credential)
  const implementation = getStatusListImplementation(statusListType)
  return implementation.updateStatusListIndex(args, context)
}

// Keeping helper function for backward compatibility
export async function statusListCredentialToDetails(args: {
  statusListCredential: StatusListCredential
  correlationId?: string
  driverType?: StatusListDriverType
}): Promise<StatusListResult> {
  const credential = getAssertedValue('statusListCredential', args.statusListCredential)

  let statusListType: StatusListType | undefined
  const documentFormat = CredentialMapper.detectDocumentType(credential)
  if (documentFormat === DocumentFormat.JWT) {
    const [header] = credential.split('.')
    const decodedHeader = JSON.parse(Buffer.from(header, 'base64').toString())

    if (decodedHeader.typ === 'statuslist+jwt') {
      statusListType = StatusListType.OAuthStatusList
    }
  } else if (documentFormat === DocumentFormat.MSO_MDOC) {
    statusListType = StatusListType.OAuthStatusList
    // TODO check CBOR content?
  }
  if (!statusListType) {
    const uniform = CredentialMapper.toUniformCredential(credential)
    const type = uniform.type.find((t) => t.includes('StatusList2021') || t.includes('OAuth2StatusList'))
    if (!type) {
      throw new Error('Invalid status list credential type')
    }
    statusListType = type.replace('Credential', '') as StatusListType
  }

  const implementation = getStatusListImplementation(statusListType)
  return await implementation.toStatusListDetails({
    statusListPayload: credential,
    correlationId: args.correlationId,
    driverType: args.driverType,
  })
}

export async function updateStatusListIndexFromEncodedList(
  args: UpdateStatusListFromEncodedListArgs,
  context: IAgentContext<ICredentialPlugin & IIdentifierResolution>,
): Promise<StatusListResult> {
  const { type } = getAssertedValue('type', args)
  const implementation = getStatusListImplementation(type!)
  return implementation.updateStatusListFromEncodedList(args, context)
}

export async function statusList2021ToVerifiableCredential(
  args: StatusList2021ToVerifiableCredentialArgs,
  context: IAgentContext<ICredentialPlugin & IIdentifierResolution>,
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
