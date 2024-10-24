import { AuditEventEntity } from '../../entities/eventLogger/AuditEventEntity'
import { ActivityLoggingEvent, AuditLoggingEvent } from '@sphereon/ssi-sdk.core'
import { LoggingEventType } from '@sphereon/ssi-types'
import { replaceNullWithUndefined } from '../FormattingUtils'

export const auditEventFrom = (event: AuditEventEntity): AuditLoggingEvent => {
  const result: AuditLoggingEvent = {
    id: event.id,
    type: LoggingEventType.AUDIT,
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

export const activityEventFrom = (event: AuditEventEntity): ActivityLoggingEvent => {

  const result: ActivityLoggingEvent =  {
    id: event.id,
    type: LoggingEventType.ACTIVITY,
    credentialType: event.credentialType!,
    originalCredential: event.originalCredential,
    credentialHash: event.credentialHash,
    sharePurpose: event.sharePurpose,
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
