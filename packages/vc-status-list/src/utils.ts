import { CompactJWT, IIssuer, ProofFormat, StatusListType, StatusListType as StatusListTypeW3C } from '@sphereon/ssi-types'
import { StatusListJWTPayload } from '@sd-jwt/jwt-status-list'
import base64url from 'base64url'

export function decodeStatusListJWT(jwt: CompactJWT): StatusListJWTPayload {
  const parts = jwt.split('.')
  return JSON.parse(base64url.decode(parts[1]))
}

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

const ValidProofTypeMap = new Map<StatusListType, ProofFormat[]>([
  [StatusListType.StatusList2021, ['jwt', 'lds', 'EthereumEip712Signature2021']],
  [StatusListType.OAuthStatusList, ['jwt', 'cbor']],
])

export function assertValidProofType(type: StatusListType, proofFormat: ProofFormat) {
  const validProofTypes = ValidProofTypeMap.get(type)
  if (!validProofTypes?.includes(proofFormat)) {
    throw Error(`Invalid proof format '${proofFormat}' for status list type ${type}`)
  }
}
