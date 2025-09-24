import type { ActivityLoggingEvent, AuditLoggingEvent } from '@sphereon/ssi-sdk.core'
import type { NonPersistedActivityLoggingEvent, NonPersistedAuditLoggingEvent } from '@sphereon/ssi-sdk.data-store-types'
import { LoggingEventType } from '@sphereon/ssi-types'
import { AuditEventEntity } from '../../entities/eventLogger/AuditEventEntity'
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

export const auditEventEntityFrom = (args: NonPersistedAuditLoggingEvent): AuditEventEntity => {
  const auditEventEntity: AuditEventEntity = new AuditEventEntity()
  auditEventEntity.type = LoggingEventType.AUDIT
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

export const activityEventFrom = (event: AuditEventEntity): ActivityLoggingEvent => {
  const result: ActivityLoggingEvent = {
    id: event.id,
    type: LoggingEventType.ACTIVITY,
    credentialType: event.credentialType!,
    originalCredential: event.originalCredential,
    credentialHash: event.credentialHash,
    parentCredentialHash: event.parentCredentialHash,
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

export const activityEventEntityFrom = (args: NonPersistedActivityLoggingEvent): AuditEventEntity => {
  const activityEventEntity: AuditEventEntity = new AuditEventEntity()
  activityEventEntity.type = LoggingEventType.ACTIVITY
  activityEventEntity.timestamp = args.timestamp
  activityEventEntity.level = args.level
  activityEventEntity.correlationId = args.correlationId
  activityEventEntity.system = args.system
  activityEventEntity.subSystemType = args.subSystemType
  activityEventEntity.actionType = args.actionType
  activityEventEntity.actionSubType = args.actionSubType
  activityEventEntity.initiatorType = args.initiatorType
  activityEventEntity.systemCorrelationIdType = args.systemCorrelationIdType
  activityEventEntity.systemCorrelationId = args.systemCorrelationId
  activityEventEntity.systemAlias = args.systemAlias
  activityEventEntity.partyCorrelationType = args.partyCorrelationType
  activityEventEntity.partyCorrelationId = args.partyCorrelationId
  activityEventEntity.partyAlias = args.partyAlias
  activityEventEntity.description = args.description
  activityEventEntity.partyCorrelationType = args.partyCorrelationType
  activityEventEntity.data = JSON.stringify(args.data)
  activityEventEntity.sharePurpose = args.sharePurpose
  activityEventEntity.credentialType = args.credentialType
  activityEventEntity.originalCredential = args.originalCredential
  activityEventEntity.credentialHash = args.credentialHash
  activityEventEntity.parentCredentialHash = args.parentCredentialHash
  activityEventEntity.diagnosticData = JSON.stringify(args.diagnosticData)

  return activityEventEntity
}
