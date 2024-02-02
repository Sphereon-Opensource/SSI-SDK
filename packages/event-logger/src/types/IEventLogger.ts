import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { AuditLoggingEvent, NonPersistedAuditLoggingEvent as NPAuditLoggingEvent, LoggingEventType, SubSystem, System, InitiatorType } from '@sphereon/ssi-sdk.core'
import { AbstractEventLoggerStore, FindAuditLoggingEventArgs } from '@sphereon/ssi-sdk.data-store'

export interface IEventLogger extends IPluginMethodMap {
  loggerGetAuditEvents(args?: GetAuditEventsArgs): Promise<Array<AuditLoggingEvent>>
  loggerLogAuditEvent(args: LogAuditEventArgs, context: RequiredContext): Promise<AuditLoggingEvent>
}

export type EventLoggerOptions = {
  store?: AbstractEventLoggerStore
  eventTypes: Array<LoggingEventType>
}

export type GetAuditEventsArgs = {
  filter?: FindAuditLoggingEventArgs
}

export type LogAuditEventArgs = {
  event: NonPersistedAuditLoggingEvent
}

export type NonPersistedAuditLoggingEvent = Omit<NPAuditLoggingEvent, 'system' | 'subSystemType' | 'initiatorType'> & {
  system: System
  subSystemType: SubSystem
  initiatorType: InitiatorType
}

export type LoggingEvent = {
  type: LoggingEventType
  data: NonPersistedAuditLoggingEvent
}

export type RequiredContext = IAgentContext<IEventLogger>
