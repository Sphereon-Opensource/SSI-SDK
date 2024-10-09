import {
  ActionSubType,
  ActionType,
  InitiatorType,
  LoggingEventType,
  LogLevel,
  SimpleLogEvent,
  SubSystem,
  System,
  SystemCorrelationIdType,
} from '@sphereon/ssi-types'
import { IAgentContext } from '@veramo/core'

export enum PartyCorrelationType {
  DID = 'did',
  URL = 'url',
  EMAIL = 'email',
  HOSTNAME = 'hostname',
  PHONE = 'phone',
}

export type AuditLoggingEvent = Omit<SimpleLogEvent, 'data'> & {
  id: string
  // timestamp: Date
  // level: LogLevel
  correlationId: string
  system: System
  subSystemType: SubSystem
  actionType: ActionType
  actionSubType: ActionSubType
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

//todo the fields credentialType, data, originalCredential and credentialHash should be required in this type
export type ActivityLoggingEvent = Omit<AuditLoggingEvent, 'data'> & {
  originalCredential?: string
  credentialHash?: string
  credentialType?: CredentialType
  sharePurpose?: string
  data?: any
}

export type PartialAuditLoggingEvent = Partial<AuditLoggingEvent>

export type PartialActivityLoggingEvent = Partial<ActivityLoggingEvent>

export type NonPersistedAuditLoggingEvent = Omit<
  AuditLoggingEvent,
  'id' | 'timestamp' | 'level' | 'correlationId' | 'system' | 'subSystemType' | 'initiatorType'
> & {
  level?: LogLevel
  correlationId?: string
  system?: System
  subSystemType?: SubSystem
  initiatorType?: InitiatorType
}

export type NonPersistedActivityLoggingEvent = Omit<
  ActivityLoggingEvent,
  'id' | 'timestamp' | 'level' | 'correlationId' | 'system' | 'subSystemType' | 'initiatorType'
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
  data: NonPersistedAuditLoggingEvent
}

export type EventLoggerArgs = {
  context?: IAgentContext<any>
  namespace?: string
  system?: System
  subSystem?: SubSystem
  logLevel?: LogLevel
  initiatorType?: InitiatorType
}
