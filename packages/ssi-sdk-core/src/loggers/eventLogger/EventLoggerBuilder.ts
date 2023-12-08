import { IAgentContext } from '@veramo/core'
import EventLogger from './EventLogger'

class EventLoggerBuilder {
  private context?: IAgentContext<any>;
  private namespace?: string

  withContext(context: IAgentContext<any>): this {
    this.context = context;
    return this;
  }

  withNamespace(namespace: string): this {
    this.namespace = namespace;
    return this;
  }

  public build(): EventLogger {
    return new EventLogger({
      context: this.context,
      namespace: this.namespace
    })
  }

}

export default EventLoggerBuilder;
