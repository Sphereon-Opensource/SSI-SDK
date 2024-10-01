import { InitiatorType, LoggingEventType, LogLevel, SubSystem, System } from '@sphereon/ssi-types'
import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import {
  AuditLoggingEvent,
  CredentialType,
  NonPersistedAuditLoggingEvent as NPAuditLoggingEvent,
  NonPersistedActivityLoggingEvent as NPActivityLoggingEvent,
  ActivityLoggingEvent,
} from '@sphereon/ssi-sdk.core'
import { AbstractEventLoggerStore, FindActivityLoggingEventArgs, FindAuditLoggingEventArgs } from '@sphereon/ssi-sdk.data-store'

export interface IEventLogger extends IPluginMethodMap {
  loggerGetAuditEvents(args?: GetAuditEventsArgs): Promise<Array<AuditLoggingEvent>>
  loggerLogAuditEvent(args: LogEventArgs, context: RequiredContext): Promise<AuditLoggingEvent>
  loggerLogGeneralEvent(args: LogEventArgs, context: RequiredContext): Promise<NonPersistedAuditLoggingEvent>
  loggerLogActivityEvent(args: LogActivityEventArgs, context: RequiredContext): Promise<ActivityLoggingEvent>
  loggerGetActivityEvents(args?: GetActivityEventsArgs): Promise<Array<ActivityLoggingEvent>>
}

export interface EventLoggerGeneralLogOpts {
  debugPkg?: boolean
  console?: boolean
  events?: boolean
  eventName?: string
  defaultLogLevel?: LogLevel
}

export type EventLoggerOptions = {
  store?: AbstractEventLoggerStore
  eventTypes: Array<LoggingEventType>
  general?: EventLoggerGeneralLogOpts
}

export type GetAuditEventsArgs = {
  filter?: FindAuditLoggingEventArgs
}

export type GetActivityEventsArgs = {
  filter?: FindActivityLoggingEventArgs
}

export type LogEventArgs = {
  event: NonPersistedAuditLoggingEvent | NonPersistedActivityLoggingEvent
}

export type LogActivityEventArgs = {
  event: NonPersistedActivityLoggingEvent
}

export type NonPersistedAuditLoggingEvent = Omit<NPAuditLoggingEvent, 'system' | 'subSystemType' | 'initiatorType'> & {
  system: System
  subSystemType: SubSystem
  initiatorType: InitiatorType
}

export type NonPersistedActivityLoggingEvent = Omit<NPActivityLoggingEvent, 'system' | 'subSystemType' | 'initiatorType'> & {
  system: System
  subSystemType: SubSystem
  initiatorType: InitiatorType
  originalCredential?: string
  credentialHash?: string
  credentialType?: CredentialType
  sharePurpose?: string
  data?: any
}

export type LoggingEvent = {
  type: LoggingEventType
  data: NonPersistedAuditLoggingEvent | NonPersistedActivityLoggingEvent
}

export type RequiredContext = IAgentContext<IEventLogger>
