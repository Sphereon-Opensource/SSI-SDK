import { IRequiredContext } from '../../types'
import { StatusList } from '@sd-jwt/jwt-status-list'

export interface DecodedStatusListPayload {
  issuer: string
  id: string
  statusList: StatusList
  exp?: number
  ttl?: number
  iat: number
}

export const resolveIdentifier = async (context: IRequiredContext, issuer: string, keyRef?: string) => {
  return await context.agent.identifierManagedGet({
    identifier: issuer,
    vmRelationship: 'assertionMethod',
    offlineWhenNoDIDRegistered: true,
    ...(keyRef && { kmsKeyRef: keyRef }), // TODO the getDid resolver should look at this ASAP
  })
}
