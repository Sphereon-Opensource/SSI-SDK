import { IAgentContext } from '@veramo/core'
import Debug, { Debugger } from 'debug'
import {
  NonPersistedAuditLoggingEvent,
  EventLoggerArgs,
  LoggingEvent,
  LogLevel,
  SubSystem,
  System,
  InitiatorType
} from '../../types'

class EventLogger {
  private readonly context?: IAgentContext<any>
  private readonly namespace?: string
  private readonly system?: System
  private readonly subSystemType?: SubSystem
  private readonly logLevel: LogLevel
  private readonly initiatorType?: InitiatorType
  private readonly debug: Debugger
  constructor(args: EventLoggerArgs) {
    const {
      context,
      namespace = 'sphereon:ssi-sdk:EventLogger',
      system,
      subSystem,
      logLevel = LogLevel.INFO,
      initiatorType
    } = args

    this.context = context
    this.namespace = namespace
    this.system = system
    this.subSystemType = subSystem
    this.logLevel = logLevel
    this.initiatorType = initiatorType
    this.debug = Debug(this.namespace)
  }

  public logEvent = async (event: LoggingEvent): Promise<void> => {
    if (!this.system || event.data.system) {
      return Promise.reject(Error('Required system is not present'))
    }

    if (!this.subSystemType || event.data.subSystemType) {
      return Promise.reject(Error('Required sub system type is not present'))
    }

    const eventData: NonPersistedAuditLoggingEvent = {
      ...event.data,
      ...(!event.data.level && { level: this.logLevel }),
      ...(!event.data.system && { system: this.system }),
      ...(!event.data.subSystemType && { subSystemType: this.subSystemType }),
      ...(!event.data.initiatorType && { initiatorType: this.initiatorType }),
    }

    // TODO make default behaviour more configurable once we have a logger registry
    this.debug('logging event:', event)
    if (this.context?.agent) {
      await this.context.agent.emit(event.type, eventData)
    }
  }
}

export default EventLogger
