import { debug } from 'debug'
import { EventEmitter } from 'events'

export enum LogLevel {
  TRACE = 0,
  DEBUG,
  INFO,
  WARNING,
  ERROR,
}

export enum LoggingEventType {
  AUDIT = 'audit',
  GENERAL = 'general',
}

export interface SimpleLogEvent {
  type: LoggingEventType.GENERAL
  level: LogLevel
  correlationId?: string
  timestamp: Date
  data: string
  diagnosticData?: any
}

export enum LogMethod {
  DEBUG_PKG,
  CONSOLE,
  EVENT,
}

export interface SimpleLogOptions {
  namespace?: string
  eventName?: string
  defaultLogLevel?: LogLevel
  methods?: LogMethod[]
}

export function logOptions(opts?: SimpleLogOptions): Required<SimpleLogOptions> {
  return {
    namespace: opts?.namespace ?? 'sphereon',
    eventName: opts?.eventName ?? 'sphereon:default',
    defaultLogLevel: opts?.defaultLogLevel ?? LogLevel.INFO,
    methods: opts?.methods ?? [LogMethod.DEBUG_PKG, LogMethod.EVENT],
  }
}

export class Loggers {
  private static readonly DEFAULT_KEY = '__DEFAULT__'
  public static readonly DEFAULT: Loggers = new Loggers({
    defaultLogLevel: LogLevel.INFO,
    methods: [LogMethod.DEBUG_PKG, LogMethod.EVENT],
  })
  private readonly namespaceOptions: Map<string, Required<SimpleLogOptions>> = new Map()
  private readonly loggers: WeakMap<Required<SimpleLogOptions>, ISimpleLogger<any>> = new WeakMap()

  constructor(defaultOptions?: Omit<SimpleLogOptions, 'namespace'>) {
    this.defaultOptions(logOptions(defaultOptions))
  }

  public options(namespace: string, options: Omit<SimpleLogOptions, 'namespace'>): this {
    this.namespaceOptions.set(namespace, logOptions({ ...options, namespace }))
    return this
  }

  public defaultOptions(options: Omit<SimpleLogOptions, 'namespace'>): this {
    this.options(Loggers.DEFAULT_KEY, options)
    return this
  }

  register<T>(namespace: string, logger: ISimpleLogger<T>): ISimpleLogger<T> {
    return this.get(namespace, logger)
  }

  get<T>(namespace: string, registerLogger?: ISimpleLogger<T>): ISimpleLogger<T> {
    const options = this.namespaceOptions.get(namespace) ?? registerLogger?.options ?? this.namespaceOptions.get(Loggers.DEFAULT_KEY)
    if (!options) {
      throw Error(`No logging options found for namespace ${namespace}`)
    }
    this.namespaceOptions.set(namespace, options)

    let logger = this.loggers.get(options)
    if (!logger) {
      logger = registerLogger ?? new SimpleLogger(options)
      this.loggers.set(options, logger)
    }
    return logger
  }
}

export type ISimpleLogger<LogType> = {
  options: Required<SimpleLogOptions>
  log(value: LogType, ...args: any[]): void
  info(value: LogType, ...args: any[]): void
  debug(value: LogType, ...args: any[]): void
  trace(value: LogType, ...args: any[]): void
  warning(value: LogType, ...args: any[]): void
  error(value: LogType, ...args: any[]): void
  logl(level: LogLevel, value: LogType, ...argsW: any[]): void
}

export class SimpleLogger implements ISimpleLogger<any> {
  private _eventEmitter = new EventEmitter({ captureRejections: true })
  private _options: Required<SimpleLogOptions>

  constructor(opts?: SimpleLogOptions) {
    this._options = logOptions(opts)
  }

  get eventEmitter(): EventEmitter {
    return this._eventEmitter
  }

  get options(): Required<SimpleLogOptions> {
    return this._options
  }

  trace(value: any, ...args: any[]) {
    this.logImpl(LogLevel.TRACE, value, ...args)
  }

  debug(value: any, ...args: any[]) {
    this.logImpl(LogLevel.DEBUG, value, ...args)
  }

  info(value: any, ...args: any[]) {
    this.logImpl(LogLevel.INFO, value, ...args)
  }

  warning(value: any, ...args: any[]) {
    this.logImpl(LogLevel.WARNING, value, ...args)
  }

  error(value: any, ...args: any[]) {
    this.logImpl(LogLevel.ERROR, value, ...args)
  }

  logl(level: LogLevel, value: any, ...args: any[]) {
    this.logImpl(level, value, ...args)
  }

  private logImpl(level: LogLevel, value: any, ...args: any[]) {
    const date = new Date().toISOString()
    const filteredArgs = args?.filter((v) => v!!) ?? []
    const arg = filteredArgs.length === 0 || filteredArgs[0] == undefined ? undefined : filteredArgs

    function toLogValue(options: SimpleLogOptions): any {
      if (typeof value === 'string') {
        return `${date}-(${options.namespace}) ${value}`
      } else if (typeof value === 'object') {
        value['namespace'] = options.namespace
        value['time'] = date
      }
      return value
    }

    const logValue = toLogValue(this.options)
    const logArgs = [logValue]
    if (arg) {
      logArgs.push(args)
    }
    let debugPkgEnabled = this.options.methods.includes(LogMethod.DEBUG_PKG)
    if (debugPkgEnabled) {
      const debugPkgDebugger = debug(this._options.namespace)
      // It was enabled at the options level in code, but could be disabled at runtime using env vars
      debugPkgEnabled = debugPkgDebugger.enabled
      if (debugPkgEnabled) {
        if (arg) {
          debugPkgDebugger(`${date}- ${value},`, ...arg)
        } else {
          debugPkgDebugger(`${date}- ${value}`)
        }
      }
    }

    // We do not perform console.logs in case the debug package is enabled in code and used at runtime
    if (this.options.methods.includes(LogMethod.CONSOLE) && !debugPkgEnabled) {
      const [value, args] = logArgs
      let logMethod = console.info
      switch (level) {
        case LogLevel.TRACE:
          logMethod = console.trace
          break
        case LogLevel.DEBUG:
          logMethod = console.debug
          break
        case LogLevel.INFO:
          logMethod = console.info
          break
        case LogLevel.WARNING:
          logMethod = console.warn
          break
        case LogLevel.ERROR:
          logMethod = console.error
          break
      }
      if (args) {
        logMethod(value + ',', ...args)
      } else {
        logMethod(value)
      }
    }

    if (this.options.methods.includes(LogMethod.EVENT)) {
      this._eventEmitter.emit(this.options.eventName, {
        data: value.toString(),
        timestamp: new Date(date),
        level,
        type: LoggingEventType.GENERAL,
        diagnosticData: logArgs,
      } satisfies SimpleLogEvent)
    }
  }

  log(value: any, ...args: any[]) {
    this.logImpl(this.options.defaultLogLevel, value, ...args)
  }
}

export class SimpleRecordLogger extends SimpleLogger implements ISimpleLogger<Record<string, any>> {
  constructor(opts?: SimpleLogOptions) {
    super(opts)
  }
}
