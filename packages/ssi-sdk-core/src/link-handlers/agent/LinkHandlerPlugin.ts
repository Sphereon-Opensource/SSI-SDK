import { IAgentContext, IAgentPlugin } from '@veramo/core'
import Debug from 'debug'
import { ILinkHandlerPlugin, LinkHandlerEvent, LinkHandlerEventArgs, LinkHandlerEventType, LinkHandlers } from '../index'

const debug = Debug(`sphereon:ssi-sdk:LinkHandler`)
/**
 * {@inheritDoc ILinkHandlerPlugin}
 */

export class LinkHandlerPlugin implements IAgentPlugin {
  // readonly schema = schema.IEventLogger
  readonly eventTypes?: Array<LinkHandlerEventType> = []
  readonly handlers: LinkHandlers

  readonly methods: ILinkHandlerPlugin = {
    linkHandlerHandleURL: this.linkHandlerHandleURL.bind(this),
  }

  constructor(options: { eventTypes?: LinkHandlerEventType[]; handlers: LinkHandlers }) {
    const { eventTypes, handlers } = options
    this.eventTypes = eventTypes
    this.handlers = handlers
  }

  public async onEvent(event: LinkHandlerEvent, context: IAgentContext<ILinkHandlerPlugin>): Promise<void> {
    switch (event.type) {
      case LinkHandlerEventType.LINK_HANDLER_URL:
        // Calling the context of the agent to make sure the REST client is called when configured
        await context.agent.linkHandlerHandleURL({ ...event.data })
        break
      default:
        return Promise.reject(Error(`Event type ${event.type} not supported`))
    }
  }

  private async linkHandlerHandleURL(args: LinkHandlerEventArgs): Promise<void> {
    const { url, source, options } = args
    debug(`received url '${url} from source ${source}`)
    return await this.handlers.handle(args.url, options)
  }
}
