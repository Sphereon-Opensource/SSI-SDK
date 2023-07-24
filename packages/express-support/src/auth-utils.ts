import express, { NextFunction } from 'express'
import passport from 'passport'
import { EndpointArgs } from './types'

export const checkUserIsInRole = (opts: { roles: string | string[] }) => (req: express.Request, res: express.Response, next: NextFunction) => {
  if (!opts?.roles || opts.roles.length === 0) {
    return next()
  }
  const roles = Array.isArray(opts.roles) ? opts.roles : [opts.roles]
  if (!req?.user || !('role' in req.user)) {
    return res.status(401).end()
  }

  // @ts-ignore
  const hasRole = roles.find((role) => req.user.role.toLowerCase() === role.toLowerCase())
  if (!hasRole) {
    return res.status(403).end()
  }

  return next()
}

const checkAuthenticationImpl = (req: express.Request, res: express.Response, opts?: EndpointArgs) => {
  if (!opts || !opts.authentication || opts.authentication.enabled === false) {
    return
  }
  if (!opts.authentication.strategy) {
    return res.status(401).end()
  }
  passport.authenticate(opts.authentication.strategy)

  if (typeof req.isAuthenticated !== 'function' || !req.isAuthenticated()) {
    return res.status(403).end()
  }
  return
}
const checkAuthorizationImpl = (req: express.Request, res: express.Response, opts?: EndpointArgs) => {
  if (!opts || !opts.authentication || !opts.authorization || opts.authentication.enabled === false || opts?.authorization.enabled === false) {
    return
  }
  const authorization = opts.authorization

  if (!authorization.enforcer && (!authorization.requireUserInRoles || authorization.requireUserInRoles.length === 0)) {
    console.log(`Authorization enabled for endpoint, but no enforcer or roles supplied`)
    return res.status(401).end()
  }
  if (authorization.requireUserInRoles && authorization.requireUserInRoles.length > 0) {
    checkUserIsInRole({ roles: authorization.requireUserInRoles })
  }
  if (authorization.enforcer) {
    const enforcer = authorization.enforcer
    const permitted = enforcer.enforceSync(req.user, opts.resource, opts.operation)
    if (!permitted) {
      console.log(`Access to ${opts.resource} and op ${opts.operation} not allowed for ${req.user}`)
      return res.status(403).end()
    }
  }
  return
}

const executeRequestHandlers = (req: express.Request, res: express.Response, next: NextFunction, opts?: EndpointArgs) => {
  if (opts?.handlers) {
    opts.handlers.forEach((requestHandler) => requestHandler(req, res, next))
  }
}

export const checkAuthenticationOnly = (opts?: EndpointArgs) => (req: express.Request, res: express.Response, next: NextFunction) => {
  executeRequestHandlers(req, res, next, opts)
  return checkAuthenticationImpl(req, res, opts) ?? next()
}

export const checkAuthorizationOnly = (opts?: EndpointArgs) => (req: express.Request, res: express.Response, next: NextFunction) => {
  executeRequestHandlers(req, res, next, opts)
  return checkAuthorizationImpl(req, res, opts) ?? next()
}
export const checkAuth = (opts?: EndpointArgs) => (req: express.Request, res: express.Response, next: NextFunction) => {
  /*const handlers = /!*this._handlers ??*!/ []
    checkAuthenticationImpl(req, res, opts))
    handlers.push(checkAuthorizationImpl(req, res, opts))
    handlers.push(next)
    return handlers
*/
  executeRequestHandlers(req, res, next, opts)
  return checkAuthenticationImpl(req, res, opts) ?? checkAuthorizationImpl(req, res, opts) ?? next()
}
