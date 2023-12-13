import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { AuditLoggingEvent, AuditLoggingEvent_TEMP, LoggingEventType } from '@sphereon/ssi-sdk.core'
import { AbstractEventLoggerStore, FindAuditLoggingEventArgs } from '@sphereon/ssi-sdk.data-store'

export interface IEventLogger extends IPluginMethodMap {
  loggerGetAuditEvents(args?: GetAuditEventsArgs): Promise<Array<AuditLoggingEvent>>
  loggerLogAuditEvent(args: LogAuditEventArgs, context: RequiredContext): Promise<AuditLoggingEvent>
}

export type EventLoggerOptions = {
  store: AbstractEventLoggerStore
  eventTypes: Array<LoggingEventType>
}

export type GetAuditEventsArgs = {
  filter?: FindAuditLoggingEventArgs
}

export type LogAuditEventArgs = {
  event: AuditLoggingEvent_TEMP
}


export type RequiredContext = IAgentContext<never>
