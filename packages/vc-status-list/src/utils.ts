import {
  CredentialMapper,
  IIssuer,
  CredentialProofFormat,
  StatusListType,
  StatusListType as StatusListTypeW3C,
  StatusListCredential,
  DocumentFormat,
} from '@sphereon/ssi-types'
import { jwtDecode } from 'jwt-decode'

export function getAssertedStatusListType(type?: StatusListType) {
  const assertedType = type ?? StatusListType.StatusList2021
  if (![StatusListType.StatusList2021, StatusListType.OAuthStatusList].includes(assertedType)) {
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
  [StatusListType.StatusList2021, ['jwt', 'lds', 'EthereumEip712Signature2021']],
  [StatusListType.OAuthStatusList, ['jwt', 'cbor']],
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
      const payload: StatusListCredential = jwtDecode(credential as string)
      const keys = Object.keys(payload)
      if (keys.includes('status_list')) {
        return StatusListType.OAuthStatusList
      } else if (keys.includes('vc')) {
        return StatusListType.StatusList2021
      }
      break
    case 'lds':
      const uniform = CredentialMapper.toUniformCredential(credential)
      const type = uniform.type.find((t) => {
        return Object.values(StatusListType).some((statusType) => t.includes(statusType))
      })
      if (!type) {
        throw new Error('Invalid status list credential type')
      }
      return type.replace('Credential', '') as StatusListType

    case 'cbor':
      return StatusListType.OAuthStatusList
  }

  throw new Error('Cannot determine status list type from credential payload')
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
