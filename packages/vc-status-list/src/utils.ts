import {
  CredentialMapper,
  type IIssuer,
  type CredentialProofFormat,
  StatusListType,
  StatusListType as StatusListTypeW3C,
  type StatusListCredential,
  DocumentFormat,
} from '@sphereon/ssi-types'
import { jwtDecode } from 'jwt-decode'

export function getAssertedStatusListType(type?: StatusListType) {
  const assertedType = type ?? StatusListType.StatusList2021
  if (![StatusListType.StatusList2021, StatusListType.OAuthStatusList, StatusListType.BitstringStatusList].includes(assertedType)) {
    throw Error(`StatusList type ${assertedType} is not supported (yet)`)
  }
  return assertedType
}

export function getAssertedValue<T>(name: string, value: T): NonNullable<T> {
  if (value === undefined || value === null) {
    throw Error(`Missing required ${name} value`)
  }
  return value
}

export function getAssertedValues(args: { issuer: string | IIssuer; id: string; type?: StatusListTypeW3C | StatusListType }) {
  const type = getAssertedStatusListType(args?.type)
  const id = getAssertedValue('id', args.id)
  const issuer = getAssertedValue('issuer', args.issuer)
  return { id, issuer, type }
}

export function getAssertedProperty<T extends object>(propertyName: string, obj: T): NonNullable<any> {
  if (!(propertyName in obj)) {
    throw Error(`The input object does not contain required property: ${propertyName}`)
  }
  return getAssertedValue(propertyName, (obj as any)[propertyName])
}

const ValidProofTypeMap = new Map<StatusListType, CredentialProofFormat[]>([
  [StatusListType.StatusList2021, ['jwt', 'lds']],
  [StatusListType.OAuthStatusList, ['jwt', 'cbor']],
  [StatusListType.BitstringStatusList, ['lds', 'vc+jwt']],
])

export function assertValidProofType(type: StatusListType, proofFormat: CredentialProofFormat) {
  const validProofTypes = ValidProofTypeMap.get(type)
  if (!validProofTypes?.includes(proofFormat)) {
    throw Error(`Invalid proof format '${proofFormat}' for status list type ${type}`)
  }
}

export function determineStatusListType(credential: StatusListCredential): StatusListType {
  const proofFormat = determineProofFormat(credential)

  switch (proofFormat) {
    case 'jwt':
      return determineJwtStatusListType(credential as string)
    case 'lds':
      return determineLdsStatusListType(credential)
    case 'cbor':
      return StatusListType.OAuthStatusList
    default:
      throw new Error('Cannot determine status list type from credential payload')
  }
}

function determineJwtStatusListType(credential: string): StatusListType {
  const payload: any = jwtDecode(credential)

  // OAuth status list format
  if ('status_list' in payload) {
    return StatusListType.OAuthStatusList
  }

  // Direct credential subject
  if ('credentialSubject' in payload) {
    return getStatusListTypeFromSubject(payload.credentialSubject)
  }

  // Wrapped VC format
  if ('vc' in payload && 'credentialSubject' in payload.vc) {
    return getStatusListTypeFromSubject(payload.vc.credentialSubject)
  }

  throw new Error('Invalid status list credential: credentialSubject not found')
}

function determineLdsStatusListType(credential: StatusListCredential): StatusListType {
  const uniform = CredentialMapper.toUniformCredential(credential)
  const statusListType = uniform.type.find((type) => Object.values(StatusListType).some((statusType) => type.includes(statusType)))

  if (!statusListType) {
    throw new Error('Invalid status list credential type')
  }

  return statusListType.replace('Credential', '') as StatusListType
}

function getStatusListTypeFromSubject(credentialSubject: any): StatusListType {
  switch (credentialSubject.type) {
    case 'StatusList2021':
      return StatusListType.StatusList2021
    case 'BitstringStatusList':
      return StatusListType.BitstringStatusList
    default:
      throw new Error(`Unknown credential subject type: ${credentialSubject.type}`)
  }
}

export function determineProofFormat(credential: StatusListCredential): CredentialProofFormat {
  const type: DocumentFormat = CredentialMapper.detectDocumentType(credential)
  switch (type) {
    case DocumentFormat.JWT:
      return 'jwt'
    case DocumentFormat.MSO_MDOC:
      // Not really mdoc, just assume Cbor for now, I'd need to decode at least the header to what type of Cbor we have
      return 'cbor'
    case DocumentFormat.JSONLD:
      return 'lds'
    default:
      throw Error('Cannot determine credential payload type')
  }
}

/**
 * Ensures a value is converted to a Date object if it's a valid date string,
 * otherwise returns the original value or undefined
 *
 * @param value - The value to convert to Date (can be Date, string, or undefined)
 * @returns Date object, undefined, or the original value if conversion fails
 */
export function ensureDate(value: Date | string | undefined): Date | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'string') {
    if (value.trim() === '') {
      return undefined
    }

    const date = new Date(value)
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return undefined
    }
    return date
  }

  return undefined
}
