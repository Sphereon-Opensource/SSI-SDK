import { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import {
  CredentialMapper,
  DocumentFormat,
  IIssuer,
  OriginalVerifiableCredential,
  StatusListDriverType,
  StatusListType,
  StatusPurpose2021,
} from '@sphereon/ssi-types'

import { checkStatus, StatusList } from '@sphereon/vc-status-list'
import { CredentialStatus, DIDDocument, IAgentContext, ICredentialPlugin, ProofFormat } from '@veramo/core'
import { CredentialJwtOrJSON, StatusMethod } from 'credential-status'
import {
  CreateNewStatusListFuncArgs,
  StatusList2021ToVerifiableCredentialArgs,
  StatusListDetails,
  StatusListResult,
  UpdateStatusListFromEncodedListArgs,
  UpdateStatusListFromStatusListCredentialArgs,
} from './types'

export async function fetchStatusListCredential(args: { statusListCredential: string }): Promise<OriginalVerifiableCredential> {
  const url = getAssertedValue('statusListCredential', args.statusListCredential)
  try {
    const response = await fetch(url)
    if (!response.ok) {
      const error = `Fetching status list ${url} resulted in an error: ${response.status} : ${response.statusText}`
      throw Error(error)
    }
    const responseAsText = await response.text()
    if (responseAsText.trim().startsWith('{')) {
      return JSON.parse(responseAsText) as OriginalVerifiableCredential
    }
    return responseAsText as OriginalVerifiableCredential
  } catch (error) {
    console.log(`Fetching status list ${url} resulted in an unexpected error: ${error instanceof Error ? error.message : JSON.stringify(error)}`)
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
      credential: credential as OriginalVerifiableCredential,
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
    credential: OriginalVerifiableCredential
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
  credential: OriginalVerifiableCredential
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
}): Promise<boolean> {
  return checkStatusIndexFromStatusListCredential({
    ...args,
    statusListCredential: await fetchStatusListCredential(args),
  })
}

export async function checkStatusIndexFromStatusListCredential(args: {
  statusListCredential: OriginalVerifiableCredential
  statusPurpose?: StatusPurpose2021
  type?: StatusListType | 'StatusList2021Entry'
  id?: string
  statusListIndex: string | number
}): Promise<boolean> {
  const requestedType = getAssertedStatusListType(args.type?.replace('Entry', '') as StatusListType)
  const uniform = CredentialMapper.toUniformCredential(args.statusListCredential)
  const { issuer, type, credentialSubject, id } = uniform
  getAssertedValue('issuer', issuer) // We are only checking the value here
  getAssertedValue('credentialSubject', credentialSubject)
  if (args.statusPurpose && 'statusPurpose' in credentialSubject) {
    if (args.statusPurpose !== credentialSubject.statusPurpose) {
      throw Error(
        `Status purpose in StatusList credential with id ${id} and value ${credentialSubject.statusPurpose} does not match supplied purpose: ${args.statusPurpose}`,
      )
    }
  } else if (args.id && args.id !== id) {
    throw Error(`Status list id ${id} did not match required supplied id: ${args.id}`)
  }
  if (!type || !(type.includes(requestedType) || type.includes(requestedType + 'Credential'))) {
    throw Error(`Credential type ${JSON.stringify(type)} does not contain requested type ${requestedType}`)
  }
  // @ts-ignore
  const encodedList = getAssertedValue('encodedList', credentialSubject['encodedList'])

  const statusList = await StatusList.decode({ encodedList })
  const status = statusList.getStatus(typeof args.statusListIndex === 'number' ? args.statusListIndex : Number.parseInt(args.statusListIndex))
  return status
}

export async function createNewStatusList(
  args: CreateNewStatusListFuncArgs,
  context: IAgentContext<ICredentialPlugin & IIdentifierResolution>,
): Promise<StatusListResult> {
  const length = args?.length ?? 250000
  const proofFormat = args?.proofFormat ?? 'lds'
  const { issuer, type, id } = getAssertedValues(args)
  const correlationId = getAssertedValue('correlationId', args.correlationId)

  const list = new StatusList({ length })
  const encodedList = await list.encode()
  const statusPurpose = args.statusPurpose ?? 'revocation'
  const statusListCredential = await statusList2021ToVerifiableCredential(
    {
      ...args,
      type,
      proofFormat,
      encodedList,
    },
    context,
  )

  return {
    encodedList,
    statusListCredential,
    length,
    type,
    proofFormat,
    id,
    correlationId,
    issuer,
    statusPurpose,
    indexingDirection: 'rightToLeft',
  } as StatusListResult
}

export async function updateStatusIndexFromStatusListCredential(
  args: UpdateStatusListFromStatusListCredentialArgs,
  context: IAgentContext<ICredentialPlugin & IIdentifierResolution>,
): Promise<StatusListDetails> {
  return updateStatusListIndexFromEncodedList(
    {
      ...(await statusListCredentialToDetails(args)),
      statusListIndex: args.statusListIndex,
      value: args.value,
    },
    context,
  )
}

export async function statusListCredentialToDetails(args: {
  statusListCredential: OriginalVerifiableCredential
  correlationId?: string
  driverType?: StatusListDriverType
}): Promise<StatusListDetails> {
  const credential = getAssertedValue('statusListCredential', args.statusListCredential)
  const uniform = CredentialMapper.toUniformCredential(credential)
  const { issuer, type, credentialSubject } = uniform
  if (!type.includes('StatusList2021Credential')) {
    throw Error('StatusList2021Credential type should be present in the Verifiable Credential')
  }
  const id = getAssertedValue('id', uniform.id)
  // @ts-ignore
  const { encodedList, statusPurpose } = credentialSubject
  const proofFormat: ProofFormat = CredentialMapper.detectDocumentType(credential) === DocumentFormat.JWT ? 'jwt' : 'lds'
  return {
    id,
    encodedList,
    issuer,
    type: StatusListType.StatusList2021,
    proofFormat,
    indexingDirection: 'rightToLeft',
    length: (await StatusList.decode({ encodedList })).length,
    statusPurpose,
    statusListCredential: credential,
    ...(args.correlationId && { correlationId: args.correlationId }),
    ...(args.driverType && { driverType: args.driverType }),
  }
}

export async function updateStatusListIndexFromEncodedList(
  args: UpdateStatusListFromEncodedListArgs,
  context: IAgentContext<ICredentialPlugin & IIdentifierResolution>,
): Promise<StatusListDetails> {
  const { issuer, type, id } = getAssertedValues(args)
  const proofFormat = args?.proofFormat ?? 'lds'
  const origEncodedList = getAssertedValue('encodedList', args.encodedList)
  const index = getAssertedValue('index', typeof args.statusListIndex === 'number' ? args.statusListIndex : Number.parseInt(args.statusListIndex))
  const value = getAssertedValue('value', args.value)
  const statusPurpose = getAssertedValue('statusPurpose', args.statusPurpose)

  const statusList = await StatusList.decode({ encodedList: origEncodedList })
  statusList.setStatus(index, value)
  const encodedList = await statusList.encode()
  const statusListCredential = await statusList2021ToVerifiableCredential(
    {
      ...args,
      type,
      proofFormat,
      encodedList,
    },
    context,
  )
  return {
    encodedList,
    statusListCredential,
    length: statusList.length - 1,
    type,
    proofFormat,
    id,
    issuer,
    statusPurpose,
    indexingDirection: 'rightToLeft',
  }
}

export async function statusList2021ToVerifiableCredential(
  args: StatusList2021ToVerifiableCredentialArgs,
  context: IAgentContext<ICredentialPlugin & IIdentifierResolution>,
): Promise<OriginalVerifiableCredential> {
  const { issuer, id, type } = getAssertedValues(args)
  const identifier = await context.agent.identifierManagedGet({
    identifier: typeof issuer === 'string' ? issuer : issuer.id,
    vmRelationship: 'assertionMethod',
    offlineWhenNoDIDRegistered: true, // FIXME Fix identifier resolution for EBSI
  })
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
    proofFormat: args.proofFormat ?? 'lds',
    fetchRemoteContexts: true,
  })

  return CredentialMapper.toWrappedVerifiableCredential(verifiableCredential as OriginalVerifiableCredential).original
}

function getAssertedStatusListType(type?: StatusListType) {
  const assertedType = type ?? StatusListType.StatusList2021
  if (assertedType !== StatusListType.StatusList2021) {
    throw Error(`StatusList type ${assertedType} is not supported (yet)`)
  }
  return assertedType
}

function getAssertedValue<T>(name: string, value: T): NonNullable<T> {
  if (value === undefined || value === null) {
    throw Error(`Missing required ${name} value`)
  }
  return value
}

function getAssertedValues(args: { issuer: string | IIssuer; id: string; type?: StatusListType }) {
  const type = getAssertedStatusListType(args?.type)
  const id = getAssertedValue('id', args.id)
  const issuer = getAssertedValue('issuer', args.issuer)
  return { id, issuer, type }
}
