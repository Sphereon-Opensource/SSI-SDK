import {
  InitiatorType,
  ISimpleLogger,
  Loggers,
  LogLevel,
  LogMethod,
  SimpleLogEvent,
  SimpleLogger,
  SimpleLogOptions,
  SubSystem,
  System,
} from '@sphereon/ssi-types'
import { IAgentContext } from '@veramo/core'
import { EventLoggerArgs, LoggingEvent, NonPersistedAuditLoggingEvent } from '../../types'

class EventLogger {
  private readonly context?: IAgentContext<any>
  private readonly namespace: string
  private readonly system?: System
  private readonly subSystemType?: SubSystem
  private readonly logLevel: LogLevel
  private readonly initiatorType?: InitiatorType
  private static readonly LOGGERS = Loggers.DEFAULT

  constructor(args: EventLoggerArgs) {
    const { context, namespace = 'sphereon:ssi-sdk:EventLogger', system, subSystem, logLevel = LogLevel.INFO, initiatorType } = args

    this.context = context
    this.namespace = namespace
    this.system = system
    this.subSystemType = subSystem
    this.logLevel = logLevel
    this.initiatorType = initiatorType
  }

  private localListener(event: SimpleLogEvent) {
    const { level, data, type, ...rest } = event
    EventLogger.LOGGERS.get(this.namespace).logl(level ?? this.logLevel ?? LogLevel.INFO, data, {
      ...rest,
      ...(this.system && { system: this.system }),
      ...(this.subSystemType && { subSystem: this.subSystemType }),
    })
    if (this.context?.agent) {
      void this.context.agent.emit(type, event)
    }
  }

  public simple = (options?: Omit<SimpleLogOptions, 'namespace'>): ISimpleLogger<unknown> => {
    const logger = EventLogger.LOGGERS.options(
      this.namespace,
      options ?? {
        eventName: this.namespace,
        methods: [LogMethod.EVENT],
      },
    ).get(this.namespace) as SimpleLogger
    if (!logger.eventEmitter.listeners(logger.options.eventName ?? this.namespace).includes(this.localListener)) {
      logger.eventEmitter.addListener(logger.options.eventName ?? this.namespace, this.localListener)
    }
    return logger
  }

  public logEvent = async (event: LoggingEvent): Promise<void> => {
    const eventData = await this.eventData(event)
    EventLogger.LOGGERS.get(this.namespace).logl(eventData.level ?? LogLevel.INFO, JSON.stringify(eventData.data), eventData)
    if (this.context?.agent) {
      await this.context.agent.emit(event.type, eventData)
    }
  }

  private eventData = async (event: LoggingEvent): Promise<NonPersistedAuditLoggingEvent> => {
    if (!this.system || event.data.system) {
      return Promise.reject(Error('Required system is not present'))
    }

    if (!this.subSystemType || event.data.subSystemType) {
      return Promise.reject(Error('Required sub system type is not present'))
    }

    const result: NonPersistedAuditLoggingEvent = {
      ...event.data,
      ...(!event.data.level && { level: this.logLevel }),
      ...(!event.data.system && { system: this.system }),
      ...(!event.data.subSystemType && { subSystemType: this.subSystemType }),
      ...(!event.data.initiatorType && { initiatorType: this.initiatorType }),
    }
    return result
  }
}

export default EventLogger
