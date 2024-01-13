import { IAgentContext } from '@veramo/core'
import EventLogger from './EventLogger'
import { LogLevel, SubSystem, System } from '../../types'

class EventLoggerBuilder {
  private context?: IAgentContext<any>
  private namespace?: string
  private system?: System
  private subSystem?: SubSystem
  private logLevel?: LogLevel

  withContext(context: IAgentContext<any>): this {
    this.context = context
    return this
  }

  withNamespace(namespace: string): this {
    this.namespace = namespace
    return this
  }

  withSystem(system: System): this {
    this.system = system
    return this
  }

  withSubSystem(subSystem: SubSystem): this {
    this.subSystem = subSystem
    return this
  }

  withLogLevel(logLevel: LogLevel): this {
    this.logLevel = logLevel
    return this
  }

  public build(): EventLogger {
    return new EventLogger({
      context: this.context,
      namespace: this.namespace,
      system: this.system,
      subSystem: this.subSystem,
      logLevel: this.logLevel,
    })
  }
}

export default EventLoggerBuilder
