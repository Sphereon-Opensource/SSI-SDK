import { checkStatus as checkStatusImpl, StatusList } from '@digitalcredentials/vc-status-list'
import { getIdentifier, getKey } from '@sphereon/ssi-sdk-ext.did-utils'
import { CredentialMapper, DocumentFormat, IIssuer, OriginalVerifiableCredential } from '@sphereon/ssi-types'
import { IAgentContext, ICredentialPlugin, IDIDManager, IResolver, ProofFormat } from '@veramo/core'
import {
  CreateNewStatusListArgs,
  StatusList2021ToVerifiableCredentialArgs,
  StatusListResult,
  StatusListType,
  StatusPurpose2021,
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

export function checkStatusFunction(args: {
  mandatoryCredentialStatus?: boolean
  verifyStatusListCredential?: boolean
  verifyMatchingIssuers?: boolean
}) {
  const { mandatoryCredentialStatus, verifyStatusListCredential, verifyMatchingIssuers } = args
  return (args: { credential: OriginalVerifiableCredential; documentLoader: any; suite: any }): Promise<{ verified: boolean; error?: any }> => {
    return checkStatusFromStatusListCredential({
      ...args,
      mandatoryCredentialStatus,
      verifyStatusListCredential,
      verifyMatchingIssuers,
    })
  }
}

export async function checkStatusFromStatusListCredential(args: {
  credential: OriginalVerifiableCredential
  documentLoader: any
  suite: any
  mandatoryCredentialStatus?: boolean
  verifyStatusListCredential?: boolean
  verifyMatchingIssuers?: boolean
}): Promise<{ verified: boolean; error?: any }> {
  const verifyStatusListCredential = args.verifyStatusListCredential === undefined ? true : args.verifyStatusListCredential
  const verifyMatchingIssuers = args.verifyMatchingIssuers === undefined ? true : args.verifyMatchingIssuers
  const uniform = CredentialMapper.toUniformCredential(args.credential)
  if (!('credentialStatus' in uniform) || !uniform.credentialStatus) {
    if (args.mandatoryCredentialStatus) {
      throw Error('No credential status object found in the Verifiable Credential and it is mandatory')
    }
    return { verified: true }
  }

  return checkStatusImpl({ ...args, verifyStatusListCredential, verifyMatchingIssuers })
}

export async function simpleCheckStatusFromStatusListUrl(args: {
  statusListCredential: string
  statusPurpose?: StatusPurpose2021
  type?: StatusListType | 'StatusList2021Entry'
  id?: string
  statusListIndex: string
}): Promise<boolean> {
  return simpleCheckStatusFromStatusListCredential({
    ...args,
    statusListCredential: await fetchStatusListCredential(args),
  })
}

export async function simpleCheckStatusFromStatusListCredential(args: {
  statusListCredential: OriginalVerifiableCredential
  statusPurpose?: StatusPurpose2021
  type?: StatusListType | 'StatusList2021Entry'
  id?: string
  statusListIndex: string
}): Promise<boolean> {
  const requestedType = getAssertedStatusListType(args.type?.replace('Entry', '') as StatusListType)
  const uniform = CredentialMapper.toUniformCredential(args.statusListCredential)
  const { issuer, type, credentialSubject, id } = uniform
  getAssertedValue('issuer', issuer) // We are only checking the value here
  getAssertedValue('credentialSubject', credentialSubject)
  if (args.statusPurpose && 'statusPurpose' in credentialSubject) {
    if (args.statusPurpose !== credentialSubject.statusPurpose) {
      throw Error(
        `Status purpose in StatusList credential with id ${id} and value ${credentialSubject.statusPurpose} does not match supplied purpose: ${args.statusPurpose}`
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
  return statusList.getStatus(Number.parseInt(args.statusListIndex))
}

export async function createNewStatusList(
  args: CreateNewStatusListArgs,
  context: IAgentContext<ICredentialPlugin & IDIDManager & IResolver>
): Promise<StatusListResult> {
  const length = args?.length ?? 100000
  const proofFormat = args?.proofFormat ?? 'lds'
  const { issuer, type, id } = getAssertedValues(args)
  const list = new StatusList({ length })
  const encodedList = await list.encode()
  const statusListCredential = await statusList2021ToVerifiableCredential(
    {
      ...args,
      type,
      proofFormat,
      encodedList,
    },
    context
  )

  return { encodedList, statusListCredential, length, type, proofFormat, id, issuer, indexingDirection: 'rightToLeft' }
}

export async function updateStatusListFromStatusListCredential(
  args: UpdateStatusListFromStatusListCredentialArgs,
  context: IAgentContext<ICredentialPlugin & IDIDManager & IResolver>
) {
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
  return updateStatusListFromEncodedList(
    {
      encodedList,
      statusPurpose,
      type: 'StatusList2021',
      id,
      proofFormat,
      issuer,
      index: args.index,
      value: args.value,
    },
    context
  )
}

export async function updateStatusListFromEncodedList(
  args: UpdateStatusListFromEncodedListArgs,
  context: IAgentContext<ICredentialPlugin & IDIDManager & IResolver>
) {
  const { issuer, type, id } = getAssertedValues(args)
  const proofFormat = args?.proofFormat ?? 'lds'
  const origEncodedList = getAssertedValue('encodedList', args.encodedList)
  const index = getAssertedValue('index', args.index)
  const value = getAssertedValue('value', args.value)
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
    context
  )
  return {
    encodedList,
    statusListCredential,
    length: statusList.length - 1,
    type,
    proofFormat,
    id,
    issuer,
    indexingDirection: 'rightToLeft',
  }
}

export async function statusList2021ToVerifiableCredential(
  args: StatusList2021ToVerifiableCredentialArgs,
  context: IAgentContext<ICredentialPlugin & IDIDManager & IResolver>
): Promise<OriginalVerifiableCredential> {
  const { issuer, id, type } = getAssertedValues(args)
  const identifier = await getIdentifier({ identifier: typeof issuer === 'string' ? issuer : issuer.id }, context)
  const key = await getKey(identifier, 'assertionMethod', context, args.keyRef)
  const keyRef = key.kid
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
    keyRef,
    proofFormat: args.proofFormat ?? 'lds',
    fetchRemoteContexts: true,
  })

  return CredentialMapper.toWrappedVerifiableCredential(verifiableCredential as OriginalVerifiableCredential).original
}

function getAssertedStatusListType(type?: StatusListType) {
  const assertedType = type ?? 'StatusList2021'
  if (assertedType !== 'StatusList2021') {
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
