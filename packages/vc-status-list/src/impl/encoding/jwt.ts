import { CompactJWT } from '@sphereon/ssi-types'
import { createHeaderAndPayload, StatusList, StatusListJWTPayload } from '@sd-jwt/jwt-status-list'
import base64url from 'base64url'
import { JWTPayload } from 'did-jwt'
import { STATUS_LIST_JWT_HEADER } from '../OAuthStatusList'
import { IRequiredContext, SignedStatusListData } from '../../types'
import { DecodedStatusListPayload, resolveIdentifier } from './common'

export const createSignedJwt = async (
  context: IRequiredContext,
  statusList: StatusList,
  issuerString: string,
  id: string,
  keyRef?: string,
): Promise<SignedStatusListData> => {
  const identifier = await resolveIdentifier(context, issuerString, keyRef)
  const payload: JWTPayload = {
    iss: issuerString,
    sub: id,
    iat: Math.floor(Date.now() / 1000),
  }

  const values = createHeaderAndPayload(statusList, payload, STATUS_LIST_JWT_HEADER)
  const signedJwt = await context.agent.jwtCreateJwsCompactSignature({
    issuer: { ...identifier, noIssPayloadUpdate: false },
    protectedHeader: values.header,
    payload: values.payload,
  })

  return {
    statusListCredential: signedJwt.jwt,
    encodedList: (values.payload as StatusListJWTPayload).status_list.lst,
  }
}

export const decodeStatusListJWT = (jwt: CompactJWT): DecodedStatusListPayload => {
  const [, payloadBase64] = jwt.split('.')
  const payload = JSON.parse(base64url.decode(payloadBase64))

  if (!payload.iss || !payload.sub || !payload.status_list) {
    throw new Error('Missing required fields in JWT payload')
  }

  const statusList = StatusList.decompressStatusList(payload.status_list.lst, payload.status_list.bits)

  return {
    issuer: payload.iss,
    id: payload.sub,
    statusList,
    exp: payload.exp,
    ttl: payload.ttl,
    iat: payload.iat,
  }
}
