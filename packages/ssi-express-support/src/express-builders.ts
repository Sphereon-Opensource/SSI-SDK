/**
 * @public
 */
import bodyParser from 'body-parser'
import { Enforcer } from 'casbin'
import cors, { CorsOptions } from 'cors'

import express, { Express } from 'express'
import { Application, ApplicationRequestHandler } from 'express-serve-static-core'
import expressSession from 'express-session'
import session from 'express-session'
import http from 'http'
import { createHttpTerminator, HttpTerminator } from 'http-terminator'
import morgan from 'morgan'
import passport, { InitializeOptions } from 'passport'
import { checkUserIsInRole } from './auth-utils'
import { jsonErrorHandler } from './express-utils'
import { env } from './functions'
import { ExpressSupport, IExpressServerOpts } from './types'

type Handler<Request extends http.IncomingMessage, Response extends http.ServerResponse> = (
  req: Request,
  res: Response,
  callback: (err?: Error) => void,
) => void

export class ExpressBuilder {
  private existingExpress?: Express
  private hostnameOrIP?: string
  private port?: number
  private _handlers?: ApplicationRequestHandler<Application>[] = []
  private listenCallback?: () => void
  private _startListen?: boolean | undefined = undefined
  private readonly envVarPrefix?: string
  private _corsConfigurer?: ExpressCorsConfigurer
  private _sessionOpts?: session.SessionOptions
  private _usePassportAuth?: boolean = false
  private _passportInitOpts?: InitializeOptions
  private _userIsInRole?: string | string[]
  private _enforcer?: Enforcer
  private _server?: http.Server | undefined
  private _terminator?: HttpTerminator
  private _morgan?: Handler<any, any> | undefined

  private constructor(opts?: { existingExpress?: Express; envVarPrefix?: string }) {
    const { existingExpress, envVarPrefix } = opts ?? {}
    if (existingExpress) {
      this.withExpress(existingExpress)
    }
    this.envVarPrefix = envVarPrefix ?? ''
  }

  public static fromExistingExpress(opts?: { existingExpress?: Express; envVarPrefix?: string }) {
    return new ExpressBuilder(opts ?? {})
  }

  public static fromServerOpts(opts: IExpressServerOpts & { envVarPrefix?: string }) {
    const builder = new ExpressBuilder({ existingExpress: opts?.existingExpress, envVarPrefix: opts?.envVarPrefix })
    return builder.withEnableListenOpts({ ...opts, hostnameOrIP: opts.hostname, startOnBuild: opts.startListening ?? false })
  }

  public enableListen(startOnBuild?: boolean): this {
    if (startOnBuild !== undefined) {
      this._startListen = startOnBuild
    }
    return this
  }

  public withMorganLogging(opts?: { existingMorgan?: Handler<any, any>; format?: string; options?: morgan.Options<any, any> }): this {
    if (opts?.existingMorgan && (opts.format || opts.options)) {
      throw Error('Cannot using an existing morgan with either a format or options')
    }
    this._morgan = opts?.existingMorgan ?? morgan(opts?.format ?? 'dev', opts?.options)
    return this
  }

  public withEnableListenOpts({
    port,
    hostnameOrIP,
    callback,
    startOnBuild,
  }: {
    port?: number
    hostnameOrIP?: string
    startOnBuild?: boolean
    callback?: () => void
  }): this {
    port && this.withPort(port)
    hostnameOrIP && this.withHostname(hostnameOrIP)
    if (typeof callback === 'function') {
      this.withListenCallback(callback)
    }
    this._startListen = startOnBuild === true
    return this
  }

  public withPort(port: number): this {
    this.port = port
    return this
  }

  public withHostname(hostnameOrIP: string): this {
    this.hostnameOrIP = hostnameOrIP
    return this
  }

  public withListenCallback(callback: () => void): this {
    this.listenCallback = callback
    return this
  }

  public withExpress(existingExpress: Express): this {
    this.existingExpress = existingExpress
    this._startListen = false
    return this
  }

  public withCorsConfigurer(configurer: ExpressCorsConfigurer): this {
    this._corsConfigurer = configurer
    return this
  }

  public withPassportAuth(usePassport: boolean, initializeOptions?: InitializeOptions): this {
    this._usePassportAuth = usePassport
    this._passportInitOpts = initializeOptions
    return this
  }

  public withGlobalUserIsInRole(userIsInRole: string | string[]): this {
    this._userIsInRole = userIsInRole
    return this
  }

  public withEnforcer(enforcer: Enforcer): this {
    this._enforcer = enforcer
    return this
  }

  public startListening(express: Express) {
    this._server = express.listen(this.getPort(), this.getHostname(), this.listenCallback)
    this._terminator = createHttpTerminator({
      server: this._server,
      // gracefulTerminationTimeout: 10
    })

    return { server: this._server, terminator: this._terminator }
  }

  public getHostname(): string {
    return this.hostnameOrIP ?? env('HOSTNAME', this.envVarPrefix) ?? '0.0.0.0'
  }

  public getPort(): number {
    return (this.port ?? env('PORT', this.envVarPrefix) ?? 5000) as number
  }

  public setHandlers(handlers: ApplicationRequestHandler<any> | ApplicationRequestHandler<any>[]): this {
    if (Array.isArray(handlers)) {
      this._handlers = handlers
    } else if (handlers) {
      if (!this._handlers) {
        this._handlers = []
      }
      this._handlers.push(handlers)
    } else {
      this._handlers = []
    }

    return this
  }

  public addHandler(handler: ApplicationRequestHandler<any>): this {
    if (!this._handlers) {
      this._handlers = []
    }
    this._handlers.push(handler)
    return this
  }

  public withSessionOptions(sessionOpts: session.SessionOptions): this {
    this._sessionOpts = sessionOpts
    return this
  }

  public build<T extends Application>(opts?: {
    express?: Express
    startListening?: boolean
    handlers?: ApplicationRequestHandler<T> | ApplicationRequestHandler<T>[]
  }): ExpressSupport {
    const express = this.buildExpress(opts)
    const startListening = opts?.startListening === undefined ? this._startListen !== true : opts.startListening
    let started = this._server !== undefined
    if (startListening && !started) {
      this.startListening(express)
      started = true
    }

    return {
      express,
      port: this.getPort(),
      hostname: this.getHostname(),
      userIsInRole: this._userIsInRole,
      startListening,
      enforcer: this._enforcer,
      start: (opts) => {
        if (opts?.doNotStartListening) {
          console.log('Express will not start listening. You will have to start it yourself')
        } else {
          if (!started) {
            this.startListening(express)
            started = true
          }
        }

        if (opts?.disableErrorHandler !== true) {
          express.use(jsonErrorHandler)
        }
        return { server: this._server!, terminator: this._terminator! }
      },
      stop: async (terminator?: HttpTerminator) => {
        const term = terminator ?? this._terminator
        if (!term) {
          return false
        }
        return await term.terminate().then(() => true)
      },
    }
  }

  protected buildExpress<T extends Application>(opts?: {
    express?: Express
    startListening?: boolean
    handlers?: ApplicationRequestHandler<T> | ApplicationRequestHandler<T>[]
  }): express.Express {
    const app: express.Express = opts?.express ?? this.existingExpress ?? express()
    if (this._morgan) {
      app.use(this._morgan)
    }
    if (this._sessionOpts) {
      const store = this._sessionOpts.store ?? new expressSession.MemoryStore()
      this._sessionOpts.store = store
      app.use(expressSession(this._sessionOpts))
    }
    if (this._usePassportAuth) {
      app.use(passport.initialize(this._passportInitOpts))
      if (this._sessionOpts) {
        // app.use(passport.authenticate('session'))
        //_sessionOpts are not for passport session, they are for express above
        app.use(passport.session())
      }
    }
    if (this._userIsInRole) {
      app.use(checkUserIsInRole({ roles: this._userIsInRole }))
    }
    if (this._corsConfigurer) {
      this._corsConfigurer.configure({ existingExpress: app })
    }

    // @ts-ignore
    this._handlers && this._handlers.length > 0 && app.use(this._handlers)
    // @ts-ignore
    opts?.handlers && app.use(opts.handlers)
    //fixme: this should come from the config
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(bodyParser.json({ limit: '5mb' }))
    return app
  }
}

export class ExpressCorsConfigurer {
  private _disableCors?: boolean
  private _enablePreflightOptions?: boolean
  private _allowOrigin?: boolean | string | RegExp | Array<boolean | string | RegExp>
  private _allowMethods?: string | string[]
  private _allowedHeaders?: string | string[]
  private _allowCredentials?: boolean
  private readonly _express?: Express
  private readonly _envVarPrefix?: string

  constructor(args?: { existingExpress?: Express; envVarPrefix?: string }) {
    const { existingExpress, envVarPrefix } = args ?? {}
    this._express = existingExpress
    this._envVarPrefix = envVarPrefix
  }

  public allowOrigin(value: string | boolean | RegExp | Array<string | boolean | RegExp>): this {
    this._allowOrigin = value
    return this
  }

  public disableCors(value: boolean): this {
    this._disableCors = value
    return this
  }

  public allowMethods(value: string | string[]): this {
    this._allowMethods = value
    return this
  }

  public allowedHeaders(value: string | string[]): this {
    this._allowedHeaders = value
    return this
  }

  public allowCredentials(value: boolean): this {
    this._allowCredentials = value
    return this
  }

  public configure({ existingExpress }: { existingExpress?: Express }) {
    const express = existingExpress ?? this._express
    if (!express) {
      throw Error('No express passed in during construction or configure')
    }

    const disableCorsEnv = env('CORS_DISABLE', this._envVarPrefix)
    const corsDisabled = this._disableCors ?? (disableCorsEnv ? /true/.test(disableCorsEnv) : false)
    if (corsDisabled) {
      return
    }
    const envAllowOriginStr = env('CORS_ALLOW_ORIGIN', this._envVarPrefix) ?? '*'
    let envAllowOrigin: string[] | string
    if (envAllowOriginStr.includes(',')) {
      envAllowOrigin = envAllowOriginStr.split(',')
    } else if (envAllowOriginStr.includes(' ')) {
      envAllowOrigin = envAllowOriginStr.split(' ')
    } else {
      envAllowOrigin = envAllowOriginStr
    }
    if (Array.isArray(envAllowOrigin) && envAllowOrigin.length === 1) {
      envAllowOrigin = envAllowOrigin[0]
    }
    const corsOptions: CorsOptions = {
      origin: this._allowOrigin ?? envAllowOrigin,
      // todo: env vars
      ...(this._allowMethods && { methods: this._allowMethods }),
      ...(this._allowedHeaders && { allowedHeaders: this._allowedHeaders }),
      ...(this._allowCredentials !== undefined && { credentials: this._allowCredentials }),
      optionsSuccessStatus: 204,
    }

    if (this._enablePreflightOptions) {
      express.options('*', cors(corsOptions))
    }
    express.use(cors(corsOptions))
  }
}
