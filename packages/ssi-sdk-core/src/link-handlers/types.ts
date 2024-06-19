import { IAgentContext, IPluginMethodMap } from '@veramo/core'

export enum DefaultLinkPriorities {
  HIGHEST = 0,
  DEFAULT = Number.MAX_VALUE / 2,
  LOWEST = Number.MAX_VALUE,
}

export type LinkHandler = {
  id: string
  priority?: number | DefaultLinkPriorities
  supports: (url: string | URL) => boolean
  protocols: Array<string | RegExp>
  handle: (url: string | URL, opts?: Record<string, any>) => Promise<void>
}

export type LinkHandlerRegistry = {
  add: (handler: LinkHandler | LinkHandler[]) => LinkHandlerRegistry
  remove: (handler: LinkHandler | string) => boolean
  get: (id: string) => LinkHandler | undefined
  all: () => LinkHandler[]
  has: (handler: LinkHandler | string) => boolean
  clear: () => LinkHandlerRegistry
}

export type LinkHandlerEventSource = 'QR' | 'IntentHandler' | 'URL'

export type LinkHandlerEvent = {
  type: LinkHandlerEventType
  data: LinkHandlerEventData
}

export type LinkHandlerEventData = {
  source: LinkHandlerEventSource | string
  url: string | URL
  options?: Record<string, any>
}

export const emitLinkHandlerURLEvent = (event: LinkHandlerEventData, context: IAgentContext<any>): Promise<void> => {
  return context.agent.emit(LinkHandlerEventType.LINK_HANDLER_URL, event)
}

export enum LinkHandlerEventType {
  LINK_HANDLER_URL = 'link-handler-url',
}

export type LinkHandlerEventArgs = LinkHandlerEventData
export interface ILinkHandlerPlugin extends IPluginMethodMap {
  linkHandlerHandleURL(args: LinkHandlerEventArgs, context: IAgentContext<ILinkHandlerPlugin>): Promise<void>
}
