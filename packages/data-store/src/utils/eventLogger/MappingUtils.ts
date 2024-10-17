import { AuditLoggingEvent } from '@sphereon/ssi-sdk.core'
import { replaceNullWithUndefined } from '../FormattingUtils'
import { AuditEventEntity } from '../../entities/eventLogger/AuditEventEntity'
import { NonPersistedAuditLoggingEvent } from '../../types'

export const auditEventFrom = (event: AuditEventEntity): AuditLoggingEvent => {
  const result: AuditLoggingEvent = {
    id: event.id,
    description: event.description,
    timestamp: event.timestamp,
    level: event.level,
    correlationId: event.correlationId,
    actionType: event.actionType,
    actionSubType: event.actionSubType,
    initiatorType: event.initiatorType,
    partyAlias: event.partyAlias,
    partyCorrelationId: event.partyCorrelationId,
    partyCorrelationType: event.partyCorrelationType,
    subSystemType: event.subSystemType,
    system: event.system,
    systemAlias: event.systemAlias,
    systemCorrelationId: event.systemCorrelationId,
    systemCorrelationIdType: event.systemCorrelationIdType,
    ...(event.data && { data: JSON.parse(event.data) }),
    ...(event.diagnosticData && { diagnosticData: JSON.parse(event.diagnosticData) }),
  }

  return replaceNullWithUndefined(result)
}

export const auditEventEntityFrom = (args: NonPersistedAuditLoggingEvent): AuditEventEntity => {
  const auditEventEntity: AuditEventEntity = new AuditEventEntity()
  auditEventEntity.timestamp = args.timestamp
  auditEventEntity.level = args.level
  auditEventEntity.correlationId = args.correlationId
  auditEventEntity.system = args.system
  auditEventEntity.subSystemType = args.subSystemType
  auditEventEntity.actionType = args.actionType
  auditEventEntity.actionSubType = args.actionSubType
  auditEventEntity.initiatorType = args.initiatorType
  auditEventEntity.systemCorrelationIdType = args.systemCorrelationIdType
  auditEventEntity.systemCorrelationId = args.systemCorrelationId
  auditEventEntity.systemAlias = args.systemAlias
  auditEventEntity.partyCorrelationType = args.partyCorrelationType
  auditEventEntity.partyCorrelationId = args.partyCorrelationId
  auditEventEntity.partyAlias = args.partyAlias
  auditEventEntity.description = args.description
  auditEventEntity.partyCorrelationType = args.partyCorrelationType
  auditEventEntity.data = JSON.stringify(args.data)
  auditEventEntity.diagnosticData = JSON.stringify(args.diagnosticData)

  return auditEventEntity
}
