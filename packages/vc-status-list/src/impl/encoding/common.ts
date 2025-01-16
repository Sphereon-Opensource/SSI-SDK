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
  if (keyRef) {
    return await context.agent.identifierManagedGetByKid({
      identifier: keyRef,
    })
  }

  return await context.agent.identifierManagedGet({
    identifier: issuer,
    vmRelationship: 'assertionMethod',
    offlineWhenNoDIDRegistered: true,
  })
}
