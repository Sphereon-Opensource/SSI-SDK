import { Enforcer } from 'casbin'
import { Express, RequestHandler } from 'express'
import { Strategy } from 'passport'

export interface IExpressServerOpts {
  port?: number // The port to listen on
  cookieSigningKey?: string
  hostname?: string // defaults to "0.0.0.0", meaning it will listen on all IP addresses. Can be an IP address or hostname
  basePath?: string
  existingExpress?: Express
  listenCallback?: () => void
  startListening?: boolean
  // passport?: passport.PassportStatic
  // externalBaseUrl?: string // In case an external base URL needs to be exposed
}

export interface ExpressBuildResult {
  express: Express
  port: number
  hostname: string
  userIsInRole?: string | string[]
  startListening: boolean
  enforcer?: Enforcer
}

export interface ISingleEndpointOpts {
  endpoint?: EndpointArgs
  enabled?: boolean
  path?: string
}

export interface GenericAuthArgs {
  authentication?: {
    enabled?: boolean
    strategy?: string | string[] | Strategy
  }
  authorization?: {
    enabled?: boolean
    requireUserInRoles?: string | string[]
    enforcer?: Enforcer
  }
}

export interface EndpointArgs extends GenericAuthArgs {
  resource?: string
  operation?: string
  handlers?: RequestHandler<any>[]
}
