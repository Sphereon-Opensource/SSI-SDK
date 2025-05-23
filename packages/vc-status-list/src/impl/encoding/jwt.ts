import { type CompactJWT, JoseSignatureAlgorithm } from '@sphereon/ssi-types'
import { createHeaderAndPayload, StatusList, type StatusListJWTHeaderParameters, type StatusListJWTPayload } from '@sd-jwt/jwt-status-list'
import base64url from 'base64url'
import type { JWTPayload } from 'did-jwt'
import type { IRequiredContext, SignedStatusListData } from '../../types'
import { type DecodedStatusListPayload, resolveIdentifier } from './common'
import type { TKeyType } from '@veramo/core'
import { ensureManagedIdentifierResult } from '@sphereon/ssi-sdk-ext.identifier-resolution'

const STATUS_LIST_JWT_TYP = 'statuslist+jwt'

export const createSignedJwt = async (
  context: IRequiredContext,
  statusList: StatusList,
  issuerString: string,
  id: string,
  expiresAt?: Date,
  keyRef?: string,
): Promise<SignedStatusListData> => {
  const identifier = await resolveIdentifier(context, issuerString, keyRef)
  const resolution = await ensureManagedIdentifierResult(identifier, context)

  const payload: JWTPayload = {
    iss: issuerString,
    sub: id,
    iat: Math.floor(Date.now() / 1000),
    ...(expiresAt && { exp: Math.floor(expiresAt.getTime() / 1000) }),
  }

  const header: StatusListJWTHeaderParameters = {
    alg: getSigningAlgo(resolution.key.type),
    typ: STATUS_LIST_JWT_TYP,
  }
  const values = createHeaderAndPayload(statusList, payload, header)
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

export const getSigningAlgo = (type: TKeyType): JoseSignatureAlgorithm => {
  switch (type) {
    case 'Ed25519':
      return JoseSignatureAlgorithm.EdDSA
    case 'Secp256k1':
      return JoseSignatureAlgorithm.ES256K
    case 'Secp256r1':
      return JoseSignatureAlgorithm.ES256
    case 'RSA':
      return JoseSignatureAlgorithm.RS256
    default:
      throw Error('Key type not yet supported')
  }
}
