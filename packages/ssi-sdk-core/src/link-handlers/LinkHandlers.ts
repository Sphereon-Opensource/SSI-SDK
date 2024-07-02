import { Loggers } from '@sphereon/ssi-types'
import { DefaultLinkPriorities, LinkHandler, LinkHandlerRegistry } from './types'

/**
 * Class registering multiple LinkHandlers, allowing the developer to use a single compound link handler.
 * @implements {LinkHandler}
 * @implements {LinkHandlerRegistry}
 */
export class LinkHandlers implements LinkHandler, LinkHandlerRegistry {
  private readonly _id = '_LinkHandlers'
  private readonly _priority = DefaultLinkPriorities.DEFAULT // Allow someone to create a new implementation with higher priority
  private readonly _handlers: Map<string, LinkHandler> = new Map()
  private readonly _protocols: Set<string | RegExp> = new Set()

  get id() {
    return this._id
  }

  get priority(): DefaultLinkPriorities {
    return this._priority
  }

  get protocols(): Array<string | RegExp> {
    return Array.from(this._protocols)
  }

  get(id: string): LinkHandler | undefined {
    return this._handlers.get(id)
  }

  supports(urlArg: string | URL): boolean {
    const url = new URL(urlArg)
    // Optimization, does not take into account regexp registrations, but these are taken care of via the handlers
    if (
      !Array.from(this._protocols.values()).some((predicate) =>
        typeof predicate === 'string' ? url.protocol === predicate.toLowerCase() : predicate.test(url.protocol),
      )
    ) {
      return false
    }
    return this.all().some((handler) => handler.supports(url))
  }

  async handle(
    url: string | URL,
    opts?: {
      singleHandlerOnly?: boolean
      noExceptionOnNoHandler?: boolean
    } & Record<string, any>,
  ): Promise<void> {
    const { singleHandlerOnly, noExceptionOnNoHandler, ...otherOpts } = opts ?? {}
    const handlers = this.all().filter((handler) => handler.supports(url))

    if ((handlers.length === 0 || (handlers.length === 1 && handlers[0].id === LogLinkHandler.ID)) && noExceptionOnNoHandler !== true) {
      return Promise.reject(new Error(`No link handler was registered that supports URL: ${url}`))
    }
    try {
      if (singleHandlerOnly === true) {
        return await handlers[0].handle(url, otherOpts)
      }
      handlers.map(async (handler) => await handler.handle(url, otherOpts))
    } catch (e) {
      console.log(`Linkhandler error: ${e.message}`, e)
      return Promise.reject(e)
    }
  }

  add(handler: LinkHandler | LinkHandler[]): this {
    const handlers = Array.isArray(handler) ? handler : [handler]
    handlers.forEach((handler) => {
      this._handlers.set(handler.id, handler)
      handler.protocols.forEach((protocol) =>
        this._protocols.add(typeof protocol === 'string' ? (protocol.endsWith(':') ? protocol : `${protocol}:`) : protocol),
      )
    })
    return this
  }

  remove(handler: LinkHandler | string): boolean {
    const result = this._handlers.delete(typeof handler === 'string' ? handler : handler.id)
    this.rePopulateProtocols()
    return result
  }

  has(handler: LinkHandler | string): boolean {
    return this._handlers.has(typeof handler === 'string' ? handler : handler.id)
  }

  clear(): this {
    this._handlers.clear()
    this.rePopulateProtocols()
    return this
  }

  all(): LinkHandler[] {
    // Returns the handlers sorted in priority order, not insertion order
    return Array.from(this._handlers.values()).sort(
      (handler1, handler2) => (handler1.priority ?? DefaultLinkPriorities.DEFAULT) - (handler2.priority ?? DefaultLinkPriorities.DEFAULT),
    )
  }

  private rePopulateProtocols(): void {
    this._protocols.clear()
    this.all().forEach((handler) => handler.protocols.forEach((protocol) => this._protocols.add(protocol)))
  }
}

/**
 * LinkHandlerAdapter is an abstract class that implements the LinkHandler interface. It provides basic functionality
 * for handling links and can be extended to create custom link handler.
 *
 * @abstract
 * @implements {LinkHandler}
 */
export abstract class LinkHandlerAdapter implements LinkHandler {
  private readonly _id: string
  private _priority: number | DefaultLinkPriorities
  private _protocols: Array<string | RegExp>

  protected constructor(args: { id: string; priority?: number | DefaultLinkPriorities; protocols?: Array<string | RegExp> }) {
    this._id = args.id
    this._priority = args.priority ?? DefaultLinkPriorities.DEFAULT
    this._protocols =
      args.protocols?.map((protocol) =>
        typeof protocol !== 'string' ? protocol : protocol.endsWith(':') ? protocol.toLowerCase() : `${protocol.toLowerCase()}:`,
      ) ?? []
  }

  get id(): string {
    return this._id
  }

  get protocols(): Array<string | RegExp> {
    return this._protocols
  }

  protected set protocols(value: Array<string | RegExp>) {
    this._protocols = value
  }

  get priority(): number | DefaultLinkPriorities {
    return this._priority
  }

  protected set priority(value: number | DefaultLinkPriorities) {
    this._priority = value
  }

  handle(url: string | URL, opts?: Record<string, any>): Promise<void> {
    return Promise.reject(new Error(`Adapter does not handle a URL. Please implement`))
  }

  supports(urlArg: string | URL): boolean {
    const url = LinkHandlerAdapter.toURL(urlArg)
    return this.protocols.some((predicate) =>
      typeof predicate === 'string' ? url.protocol === predicate.toLowerCase() : predicate.test(url.toString()),
    )
  }

  protected static toURL(url: string | URL) {
    return new URL(url)
  }
}

/**
 * A class that logs links.
 */
export class LogLinkHandler extends LinkHandlerAdapter {
  static ID = '_log'

  constructor(args?: { priority?: number | DefaultLinkPriorities; protocols?: Array<string | RegExp> }) {
    super({
      id: LogLinkHandler.ID,
      protocols: args?.protocols ?? [/.*/],
      priority: args?.priority ?? DefaultLinkPriorities.LOWEST,
    })
  }

  handle(url: string | URL): Promise<void> {
    return Promise.resolve(Loggers.DEFAULT.get(`sphereon:link-handler:${LogLinkHandler.ID}`).log(url))
  }
}
