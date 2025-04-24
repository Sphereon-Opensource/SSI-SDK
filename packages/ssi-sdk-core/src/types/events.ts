import {
  ActionType, DefaultActionSubType,
  InitiatorType,
  LoggingEventType,
  LogLevel,
  SimpleLogEvent,
  SubSystem,
  System,
  SystemCorrelationIdType
} from '@sphereon/ssi-types'
import { IAgentContext } from '@veramo/core'

export enum PartyCorrelationType {
  DID = 'did',
  URL = 'url',
  EMAIL = 'email',
  HOSTNAME = 'hostname',
  PHONE = 'phone',
}

export type AuditLoggingEvent = Omit<SimpleLogEvent, 'type' | 'data'> & {
  id: string
  type: LoggingEventType.AUDIT
  // timestamp: Date
  // level: LogLevel
  correlationId: string
  system: System
  subSystemType: SubSystem
  actionType: ActionType
  actionSubType: DefaultActionSubType | string
  initiatorType: InitiatorType
  systemCorrelationIdType?: SystemCorrelationIdType
  systemCorrelationId?: string
  systemAlias?: string
  partyCorrelationType?: PartyCorrelationType
  partyCorrelationId?: string
  partyAlias?: string
  description: string
  data?: any
  // diagnosticData?: any
}

export enum CredentialType {
  JSON_LD = 'JSON_LD',
  JWT = 'JWT',
  SD_JWT = 'SD_JWT',
  MSO_MDOC = 'MSO_MDOC',
}

//TODO the fields credentialType, data, originalCredential and credentialHash should be required in this type
// create a general type that can be shared between AuditLoggingEvent and ActivityLoggingEvent
export type ActivityLoggingEvent = Omit<SimpleLogEvent, 'data' | 'type'> & {
  id: string
  type: LoggingEventType.ACTIVITY
  originalCredential?: string
  credentialHash?: string
  parentCredentialHash?: string
  credentialType?: CredentialType
  sharePurpose?: string
  correlationId: string
  system: System
  subSystemType: SubSystem
  actionType: ActionType
  actionSubType: DefaultActionSubType | string
  initiatorType: InitiatorType
  systemCorrelationIdType?: SystemCorrelationIdType
  systemCorrelationId?: string
  systemAlias?: string
  partyCorrelationType?: PartyCorrelationType
  partyCorrelationId?: string
  partyAlias?: string
  description: string
  data?: any
}

export type PartialAuditLoggingEvent = Partial<AuditLoggingEvent>

export type PartialActivityLoggingEvent = Partial<ActivityLoggingEvent>

export type NonPersistedAuditLoggingEvent = Omit<
  AuditLoggingEvent,
  'id' | 'timestamp' | 'level' | 'correlationId' | 'system' | 'subSystemType' | 'initiatorType' | 'type'
> & {
  level?: LogLevel
  correlationId?: string
  system?: System
  subSystemType?: SubSystem
  initiatorType?: InitiatorType
}

export type NonPersistedActivityLoggingEvent = Omit<
  ActivityLoggingEvent,
  'id' | 'timestamp' | 'level' | 'correlationId' | 'system' | 'subSystemType' | 'initiatorType' | 'type'
> & {
  level?: LogLevel
  correlationId?: string
  system?: System
  subSystemType?: SubSystem
  initiatorType?: InitiatorType
  credentialType?: CredentialType
  sharePurpose?: string
}

export type LoggingEvent = {
  type: LoggingEventType
  data: LogEventType
}

export type LogEventType = NonPersistedAuditLoggingEvent | NonPersistedActivityLoggingEvent

export type EventLoggerArgs = {
  context?: IAgentContext<any>
  namespace?: string
  system?: System
  subSystem?: SubSystem
  logLevel?: LogLevel
  initiatorType?: InitiatorType
}
