import { IAgentContext } from '@veramo/core'
import { EventLoggerArgs, LoggingEvent } from '../../types'
import Debug, { Debugger } from 'debug'

class EventLogger {
  private readonly context?: IAgentContext<any>;
  private readonly namespace?: string
  private readonly debug: Debugger

  constructor(args: EventLoggerArgs) {
    const { context, namespace } = args
    this.context = context
    this.namespace = namespace
    this.debug = Debug(this.namespace ?? 'sphereon:ssi-sdk:EventLogger')
  }

  public logEvent = async (event: LoggingEvent): Promise<void> => {
    // TODO make default behaviour more configurable once we have a logger registry
    this.debug('logging event:', event);
    if (this.context?.agent) {
      await this.context.agent.emit(event.type, event.data)
    }
  }

}

export default EventLogger;
