import { LinkHandlers, LogLinkHandler } from '../src'

describe('link handlers', () => {
  it('Should return false if no handler is registered handling the url', () => {
    const handlers = new LinkHandlers()
    expect(handlers.supports('https://localhost')).toEqual(false)
  })

  it('Should return true if a handler is registered handling the url', () => {
    const logLinkHandler = new LogLinkHandler()
    const handlers = new LinkHandlers()
    handlers.add(logLinkHandler)
    expect(handlers.protocols.length).toEqual(1)
    expect(handlers.get(logLinkHandler.id)).toBeDefined()
    expect(handlers.all()).toHaveLength(1)
    expect(handlers.has(logLinkHandler)).toEqual(true)
    expect(logLinkHandler.supports('https://localhost')).toEqual(true)
    expect(handlers.supports('https://localhost')).toEqual(true)
  })

  it('Should return false if a handler is registered not handling the url', () => {
    const logLinkHandler = new LogLinkHandler({ protocols: ['nope'] })
    const handlers = new LinkHandlers()
    handlers.add(logLinkHandler)
    expect(logLinkHandler.supports('https://localhost')).toEqual(false)
    expect(handlers.supports('https://localhost')).toEqual(false)
  })
})
