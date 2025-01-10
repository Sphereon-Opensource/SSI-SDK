import { CompactJWT, IIssuer, StatusListType as StatusListTypeW3C } from '@sphereon/ssi-types'
import { StatusListType } from './types'
import { StatusListJWTPayload } from '@sd-jwt/jwt-status-list'
import { decodeBase64url } from 'did-jwt/lib/util'

export function decodeStatusListJWT(jwt: CompactJWT): StatusListJWTPayload {
  const parts = jwt.split('.')
  return JSON.parse(decodeBase64url(parts[1]))
}

export function getAssertedStatusListType(type?: StatusListType) {
  const assertedType = type ?? StatusListType.StatusList2021
  if (assertedType !== StatusListType.StatusList2021) {
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
