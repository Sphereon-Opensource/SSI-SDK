import { AbstractEventLoggerStore } from '@sphereon/ssi-sdk.data-store'
import { Loggers, LoggingEventType, LogLevel, LogMethod } from '@sphereon/ssi-types'
import { ActivityLoggingEvent, AuditLoggingEvent } from '@sphereon/ssi-sdk.core'
import { IAgentPlugin } from '@veramo/core'
import { v4 as uuidv4 } from 'uuid'
import { schema } from '../index'
import {
  EventLoggerOptions,
  GetActivityEventsArgs,
  GetAuditEventsArgs,
  IEventLogger,
  LogActivityEventArgs,
  LogAuditEventArgs,
  LogEventArgs,
  LoggingEvent,
  LogEventType,
  RequiredContext,
} from '../types/IEventLogger'

/**
 * {@inheritDoc IEventLogger}
 */

// Exposing the methods here for any REST implementation
export const eventLoggerAuditMethods: Array<string> = [
  'loggerGetAuditEvents',
  'loggerLogAuditEvent',
  'loggerLogGeneralEvent',
  'loggerLogActivityEvent',
  'loggerGetActivityEvents',
]
export const eventLoggerMethods: Array<string> = [...eventLoggerAuditMethods]

export class EventLogger implements IAgentPlugin {
  readonly schema = schema.IEventLogger
  readonly eventTypes: Array<LoggingEventType> = []
  private readonly store?: AbstractEventLoggerStore
  readonly simpleLoggers: Loggers

  readonly methods: IEventLogger = {
    loggerGetAuditEvents: this.loggerGetAuditEvents.bind(this),
    loggerLogAuditEvent: this.loggerLogAuditEvent.bind(this),
    loggerLogGeneralEvent: this.loggerLogGeneralEvent.bind(this),
    loggerLogActivityEvent: this.loggerLogActivityEvent.bind(this),
    loggerGetActivityEvents: this.loggerGetActivityEvents.bind(this),
  }

  constructor(options: EventLoggerOptions) {
    const { store, eventTypes } = options
    const generalOpts = options.general ?? { debugPkg: true }
    this.store = store
    this.eventTypes = eventTypes

    const methods: Array<LogMethod> = []
    if (generalOpts.debugPkg) {
      methods.push(LogMethod.DEBUG_PKG)
    }
    if (generalOpts.console) {
      methods.push(LogMethod.CONSOLE)
    }
    if (generalOpts.events) {
      methods.push(LogMethod.EVENT)
    }
    this.simpleLoggers = new Loggers({
      methods,
      eventName: generalOpts.eventName,
      defaultLogLevel: generalOpts.defaultLogLevel,
    })
  }

  public async onEvent(event: LoggingEvent, context: RequiredContext): Promise<void> {
    switch (event.type) {
      case LoggingEventType.AUDIT:
        // Calling the context of the agent to make sure the REST client is called when configured
        await context.agent.loggerLogAuditEvent({ event: event.data })
        break
      case LoggingEventType.GENERAL:
        // Calling the context of the agent to make sure the REST client is called when configured
        // TODO: We might also want to do this locally though, as these logs are not persisted typically
        await context.agent.loggerLogGeneralEvent({ event: event.data })
        break
      case LoggingEventType.ACTIVITY:
        // Calling the context of the agent to make sure the REST client is called when configured
        await context.agent.loggerLogActivityEvent({ event: event.data })
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

  private async loggerGetActivityEvents(args?: GetActivityEventsArgs): Promise<Array<ActivityLoggingEvent>> {
    const { filter } = args ?? {}

    if (!this.store) {
      return Promise.reject(Error('No store available in options'))
    }

    return this.store.getActivityEvents({ filter })
  }

  private async loggerLogGeneralEvent(args: LogEventArgs): Promise<LogEventType> {
    const { event } = args
    this.simpleLoggers.get(event.data.system).logl(event.data.level ?? LogLevel.INFO, event.data.data, event.data)

    return args.event
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

  private async loggerLogActivityEvent(args: LogActivityEventArgs): Promise<ActivityLoggingEvent> {
    const { event } = args

    if (!this.store) {
      return Promise.reject(Error('No store available in options'))
    }

    return this.store.storeActivityEvent({
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
