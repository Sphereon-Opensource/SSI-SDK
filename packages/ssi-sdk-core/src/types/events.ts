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

export type AuditLoggingEvent = Omit<SimpleLogEvent, 'type' | 'data'> & {
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
export type PartialAuditLoggingEvent = Partial<AuditLoggingEvent>

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
