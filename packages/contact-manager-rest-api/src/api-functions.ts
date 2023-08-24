import { checkAuth, sendErrorResponse, ISingleEndpointOpts } from '@sphereon/ssi-express-support'
import { Request, Response, Router } from 'express'
import { IRequiredContext } from './types'
import Debug from 'debug'

const debug = Debug('sphereon:ssi-sdk:contact-manager-rest-api')

export function contactReadEndpoints(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    debug(`Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/contacts'
  router.get(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      // later we will add filter to this
      const contacts = await context.agent.cmGetContacts()
      response.statusCode = 200
      return response.send(contacts)
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
  router.get(`${path}/:contactId`, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    if (opts?.enabled === false) {
      debug(`Endpoint is disabled`)
      return
    }
    try {
      const contactId = request.params.contactId
      const contact = await context.agent.cmGetContact({ contactId })
      response.statusCode = 200
      return response.send(contact)
    } catch (e) {
      console.error(e)
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}

export function contactTypeReadEndpoints(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    debug(`Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/contact-types'
  router.get(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      // later we will add filter to this
      const contactTypes = await context.agent.cmGetContactTypes()
      response.statusCode = 200
      return response.send(contactTypes)
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
  router.get(`${path}/:contactTypeId`, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const contactTypeId = request.params.contactTypeId
      const contact = await context.agent.cmGetContactType({ contactTypeId })
      response.statusCode = 200
      return response.send(contact)
    } catch (e) {
      console.error(e)
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}

export function identityReadEndpoints(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    debug(`Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/identities'
  router.get(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      // later we will add filter to this
      const identities = await context.agent.cmGetIdentities()
      response.statusCode = 200
      return response.send(identities)
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
  router.get(`${path}/:identityId`, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const identityId = request.params.identityId
      const identity = await context.agent.cmGetIdentity({ identityId })
      response.statusCode = 200
      return response.send(identity)
    } catch (e) {
      console.error(e)
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}
