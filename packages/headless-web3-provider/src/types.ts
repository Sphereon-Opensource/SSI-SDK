import { Enforcer } from 'casbin'
import { Express, RequestHandler } from 'express'
import { Strategy } from 'passport'

export interface IWeb3Provider {
  isMetaMask?: boolean

  request(args: { method: 'eth_accounts'; params: [] }): Promise<string[]>
  request(args: {
    method: 'eth_requestAccounts'
    params: []
  }): Promise<string[]>
  request(args: { method: 'net_version'; params: [] }): Promise<number>
  request(args: { method: 'eth_chainId'; params: [] }): Promise<string>
  request(args: { method: 'personal_sign'; params: string[] }): Promise<string>
  request(args: {
    method: 'eth_signTypedData' | 'eth_signTypedData_v1'
    params: [object[], string]
  }): Promise<string>
  request(args: {
    method: 'eth_signTypedData_v3' | 'eth_signTypedData_v4'
    params: string[]
  }): Promise<string>
  request(args: { method: string; params?: any[] }): Promise<any>

  emit(eventName: string, ...args: any[]): void
  on(eventName: string, listener: (eventName: string) => void): void
}

export interface PendingRequest {
  requestInfo: { method: string; params: any[] }
  reject: (err: { message?: string; code?: number }) => void
  authorize: () => Promise<void>
}

export interface ChainConnection {
  chainId: number
  rpcUrl: string
}

export interface Web3ProviderConfig {
  debug?: boolean
  logger?: typeof console.log
}



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
