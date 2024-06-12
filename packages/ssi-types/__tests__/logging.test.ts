import { Loggers, LogMethod } from '../src'

describe('Simple logging', () => {
  it('Should perform a debug package log', () => {
    Loggers.DEFAULT.options('debug_pkg', { methods: [LogMethod.DEBUG_PKG] })
      .get('debug_pkg')
      .log('TEST DBG')
  })

  it('Should perform a console log', () => {
    Loggers.DEFAULT.options('console', { methods: [LogMethod.CONSOLE] })
      .get('console')
      .log('TEST CONSOLE', 'extra')
  })

  it('Should perform a event log', () => {
    Loggers.DEFAULT.options('event', { methods: [LogMethod.EVENT] })
      .get('event')
      .log('TEST EVENT')
  })

  it('Should perform a debug package, console and event log', () => {
    Loggers.DEFAULT.options('all', { methods: [LogMethod.DEBUG_PKG, LogMethod.CONSOLE, LogMethod.EVENT] })
      .get('all')
      .log('TEST ALL')
  })
})
