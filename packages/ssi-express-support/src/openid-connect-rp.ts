import { TAgent } from '@veramo/core'
import express, { Express, NextFunction, Router } from 'express'
import { BaseClient, ClientMetadata, ClientOptions, Issuer } from 'openid-client'
import passport from 'passport'
import { copyGlobalAuthToEndpoints, isUserAuthenticated } from './auth-utils'
import { sendErrorResponse } from './express-utils'
import { env } from './functions'
import { ExpressSupport, GenericAuthArgs, ISingleEndpointOpts } from './types'

const PREFIX = process.env.PREFIX ?? ''
export async function oidcDiscoverIssuer(opts?: { issuerUrl?: string }) {
  const issuerUrl = opts?.issuerUrl ?? env('OIDC_ISSUER', PREFIX) ?? 'https://auth01.test.sphereon.com/auth/realms/energy-shr'
  const issuer = await Issuer.discover(issuerUrl)
  console.log('Discovered issuer %s %O', issuer.issuer, issuer.metadata)
  return { issuer, issuerUrl }
}

export async function oidcGetClient(
  issuer: Issuer<BaseClient>,
  metadata: ClientMetadata,
  opts?: {
    jwks?: { keys: JsonWebKey[] }
    options?: ClientOptions
  },
) {
  // @ts-ignore
  return new issuer.Client(metadata, opts?.jwks, opts?.options)
}

export function getLoginEndpoint(router: Router, opts?: ISingleEndpointOpts & { redirectUrl?: string }) {
  if (opts?.enabled === false) {
    console.log(`Login endpoint is disabled`)
    return
  }
  const strategy = opts?.endpoint?.authentication?.strategy
  if (!strategy) {
    throw Error('strategy needs to be provided')
  }
  const path = opts?.path ?? '/authentication/login'
  router.get(
    path,
    (req: any, res: any, next: NextFunction) => {
      const redirectPage = req.get('referer') ?? '/'
      req.session.redirectPage = redirectPage
      next()
    },
    passport.authenticate(
      strategy,
      { ...opts.authentication?.strategyOptions, ...opts.endpoint?.authentication?.strategyOptions, keepSessionInfo: false },
      undefined,
    ),
  )
}

export function getLoginCallbackEndpoint(router: Router, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`Auth callback endpoint is disabled`)
    return
  }
  const strategy = opts?.endpoint?.authentication?.strategy
  if (!strategy) {
    throw Error('strategy needs to be provided')
  }
  const path = opts?.path ?? '/authentication/callback'
  router.get(
    path,
    passport.authenticate(
      strategy,
      { ...opts.authentication?.strategyOptions, ...opts.endpoint?.authentication?.strategyOptions, keepSessionInfo: true },
      undefined,
    ),
    (req: any, res: any, next) => {
      if (req.user) {
        console.log('User authenticated', req.user?.name)
        // console.log(req.session)
        const redirectPage = req.session.redirectPage ?? '/search'
        // console.log(`PRE LOGIN PAGE in callback: ${redirectPage}`)
        delete req.session.redirectPage
        return res.redirect(redirectPage)
      } else {
        return res.redirect(env('OIDC_FRONTEND_LOGIN_URL', PREFIX) ?? 'http://localhost:3001/authentication/login')
      }
    },
  )
}

export function getLogoutEndpoint(router: Router, client: BaseClient, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`Logout endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/authentication/logout'
  router.get(path, (req, res) => {
    try {
      if (client.endSessionUrl()) {
        return res.redirect(client.endSessionUrl())
      } else {
        console.log('IDP does not support end session url')
        return res.redirect('/authentication/logout-callback')
      }
    } catch (error) {
      console.log(error)
      return res.redirect('/authentication/logout-callback')
    }
  })
}

export function getLogoutCallbackEndpoint(router: Router, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`Logout callback endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/authentication/logout-callback'
  router.get(path, (req, res, next) => {
    try {
      req.logout((err) => {
        if (err) {
          console.log(`Error during calling logout-callback: ${JSON.stringify(err)}`)
        }
      })
      return res.redirect(env('OIDC_FRONTEND_LOGOUT_REDIRECT_URL', PREFIX) ?? '/')
    } catch (e) {
      return sendErrorResponse(res, 500, 'An unexpected error occurred during logout callback', e)
    }
  })
}

export function getIdTokenEndpoint(router: Router, client: BaseClient, opts: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`ID Token endpoint is disabled`)
    return
  }
  const path = opts.path ?? '/authentication/tokens/id'
  router.get(path, isUserAuthenticated, (req: any, res: any) => {
    if (req.session.tokens.id_token) {
      return res.json({ id_token: req.session.tokens.id_token })
    } else {
      return sendErrorResponse(res, 401, 'Authentication required')
    }
  })
}

export function getAuthenticatedUserEndpoint(router: Router, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`Authenticated User endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/authentication/user'
  router.get(path, isUserAuthenticated, (req: any, res: any, next: any) => {
    if (!req.user) {
      return sendErrorResponse(res, 401, 'Authentication required')
    }
    let user = req.user
    return res.json(user)
  })
}

export interface IAuthenticationOpts {
  enabledFeatures?: AuthenticationApiFeatures
  endpointOpts?: IAuthenticationEndpointOpts
}

export interface IAuthenticationEndpointOpts {
  basePath?: string
  globalAuth?: GenericAuthArgs
  getAuthenticatedUser?: ISingleEndpointOpts
  getLogin?: ISingleEndpointOpts
  getLogout?: ISingleEndpointOpts
  getIdToken?: ISingleEndpointOpts
}

export type AuthenticationApiFeatures = 'login' | 'logout' | 'id-token' | 'authenticated-user'

export class OpenIDConnectAuthApi {
  get router(): express.Router {
    return this._router
  }

  private readonly _express: Express
  private readonly _agent?: TAgent<any>
  private readonly _opts?: IAuthenticationOpts
  private readonly _router: Router

  constructor(args: { agent?: TAgent<any>; expressSupport: ExpressSupport; client: BaseClient; opts: IAuthenticationOpts }) {
    const { agent, opts } = args
    this._agent = agent
    copyGlobalAuthToEndpoints({ opts, keys: ['getLogin'] })
    copyGlobalAuthToEndpoints({ opts, keys: ['getIdToken'] })
    copyGlobalAuthToEndpoints({ opts, keys: ['getAuthenticatedUser'] })
    // no need for the logout, as you these are not protected by auth
    this._opts = opts
    this._express = args.expressSupport.express
    this._router = express.Router()
    const features = opts?.enabledFeatures ?? ['login', 'logout', 'id-token', 'authenticated-user']
    console.log(`Authentication API enabled`)

    if (features.includes('login')) {
      getLoginEndpoint(this.router, opts?.endpointOpts?.getLogin)
      getLoginCallbackEndpoint(this.router, opts?.endpointOpts?.getLogin)
    }
    if (features.includes('logout')) {
      getLogoutEndpoint(this.router, args.client, opts?.endpointOpts?.getLogout)
      getLogoutCallbackEndpoint(this.router, opts?.endpointOpts?.getLogout)
    }
    if (features.includes('id-token')) {
      if (opts.endpointOpts?.getIdToken === undefined) {
        throw Error('Cannot enable id-token endpoint without providing id-token endpoint options')
      }
      getIdTokenEndpoint(this.router, args.client, opts?.endpointOpts?.getIdToken)
    }
    if (features.includes('authenticated-user')) {
      getAuthenticatedUserEndpoint(this.router, opts?.endpointOpts?.getAuthenticatedUser)
    }
    this._express.use(opts?.endpointOpts?.basePath ?? '', this.router)
  }

  get agent(): TAgent<any> | undefined {
    return this._agent
  }

  get opts(): IAuthenticationOpts | undefined {
    return this._opts
  }

  get express(): Express {
    return this._express
  }
}
