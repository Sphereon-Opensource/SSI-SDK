import { IAgentPlugin } from '@veramo/core'
import { AbstractEventLoggerStore } from '@sphereon/ssi-sdk.data-store'
import { AuditLoggingEvent, LoggingEventType, LogLevel } from '@sphereon/ssi-sdk.core'
import { v4 as uuidv4 } from 'uuid'
import { schema } from '../index'
import { EventLoggerOptions, GetAuditEventsArgs, IEventLogger, RequiredContext, LogAuditEventArgs, LoggingEvent } from '../types/IEventLogger'

/**
 * {@inheritDoc IEventLogger}
 */

// Exposing the methods here for any REST implementation
export const eventLoggerAuditMethods: Array<string> = ['loggerGetAuditEvents', 'loggerLogAuditEvent']
export const eventLoggerMethods: Array<string> = [...eventLoggerAuditMethods]

export class EventLogger implements IAgentPlugin {
  readonly schema = schema.IEventLogger
  readonly eventTypes: Array<LoggingEventType> = []

  readonly methods: IEventLogger = {
    loggerGetAuditEvents: this.loggerGetAuditEvents.bind(this),
    loggerLogAuditEvent: this.loggerLogAuditEvent.bind(this),
  }

  private readonly store?: AbstractEventLoggerStore

  constructor(options: EventLoggerOptions) {
    const { store, eventTypes } = options
    this.store = store
    this.eventTypes = eventTypes
  }

  public async onEvent(event: LoggingEvent, context: RequiredContext): Promise<void> {
    switch (event.type) {
      case LoggingEventType.AUDIT:
        // Calling the context of the agent to make sure the REST client is called when configured
        await context.agent.loggerLogAuditEvent({ event: event.data })
        break
      default:
        return Promise.reject(Error(`Event type ${event.type} not supported`))
    }
  }

  private async loggerGetAuditEvents(args?: GetAuditEventsArgs): Promise<Array<AuditLoggingEvent>> {
    const { filter } = args ?? {}

    if (!this.store) {
      return Promise.reject(Error('No store available in options'))
    }

    return this.store.getAuditEvents({ filter })
  }

  private async loggerLogAuditEvent(args: LogAuditEventArgs): Promise<AuditLoggingEvent> {
    const { event } = args

    if (!this.store) {
      return Promise.reject(Error('No store available in options'))
    }

    return this.store.storeAuditEvent({
      event: {
        ...event,
        system: event.system,
        subSystemType: event.subSystemType,
        initiatorType: event.initiatorType,
        level: event.level ?? LogLevel.INFO,
        correlationId: event.correlationId ?? uuidv4(),
        timestamp: new Date(),
      },
    })
  }
}
