import { IAgentPlugin } from '@veramo/core'
import { AbstractEventLoggerStore } from '@sphereon/ssi-sdk.data-store'
import { AuditLoggingEvent, LoggingEvent, LoggingEventType } from '@sphereon/ssi-sdk.core'
import { v4 as uuidv4 } from 'uuid'
import { schema } from '../index'
import {
  EventLoggerOptions,
  GetAuditEventsArgs,
  IEventLogger,
  RequiredContext,
  LogAuditEventArgs
} from '../types/IEventLogger'

/**
 * {@inheritDoc IEventLogger}
 */

export class EventLogger implements IAgentPlugin {
  readonly schema = schema.IEventLogger
  readonly eventTypes: Array<LoggingEventType> = []

  readonly methods: IEventLogger = {
    loggerGetAuditEvents: this.loggerGetAuditEvents.bind(this),
    loggerLogAuditEvent: this.loggerLogAuditEvent.bind(this),
  }

  private readonly store: AbstractEventLoggerStore

  constructor(options: EventLoggerOptions) {
    const {store, eventTypes} = options
    this.store = store
    this.eventTypes = eventTypes
  }

  public async onEvent(event: LoggingEvent, context: RequiredContext): Promise<void> {
    switch(event.type) {
      case LoggingEventType.AUDIT:
        await this.loggerLogAuditEvent({ event: event.data }, context)
        break;
      default:
        return Promise.reject(Error('Event type not supported'))
    }
  }

  private async loggerGetAuditEvents(args?: GetAuditEventsArgs): Promise<Array<AuditLoggingEvent>> {
    const { filter } = args ?? {}

    return this.store.getAuditEvents({ filter })
  }

  private async loggerLogAuditEvent(args: LogAuditEventArgs, context: RequiredContext): Promise<AuditLoggingEvent> {
    const { event } = args

    return this.store.storeAuditEvent({ event: {
        ...event,
        correlationId: event.correlationId ?? uuidv4(),
        timestamp: new Date()
      }
    })
  }

}
