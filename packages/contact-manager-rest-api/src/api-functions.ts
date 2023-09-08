import { checkAuth, sendErrorResponse, ISingleEndpointOpts } from '@sphereon/ssi-express-support'
import { Request, Response, Router } from 'express'
import { IRequiredContext } from './types'
import Debug from 'debug'
import { AddContactArgs } from '@sphereon/ssi-sdk.contact-manager'

const debug = Debug('sphereon:ssi-sdk:contact-manager-rest-api')

export function partyReadEndpoints(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    debug(`Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/parties'
  router.get(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      // later we will add filter to this
      const parties = await context.agent.cmGetContacts()
      response.statusCode = 200
      return response.send(parties)
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
  router.get(`${path}/:partyId`, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    if (opts?.enabled === false) {
      debug(`Endpoint is disabled`)
      return
    }
    try {
      const partyId = request.params.contactId
      const party = await context.agent.cmGetContact({ contactId: partyId })
      response.statusCode = 200
      return response.send(party)
    } catch (e) {
      console.error(e)
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}

export function partyWriteEndpoints(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    debug(`Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/parties'
  router.post(path, async (request: Request, response: Response) => {
    try {
      const addParty = request.body
      const party = await context.agent.cmAddContact(addParty as AddContactArgs)
      response.statusCode = 201
      return response.send(party)
    } catch (error) {
      console.error(error)
      return sendErrorResponse(response, 500, 'Could not add party')
    }
  })
  router.delete(`${path}/:partyId`, async (request, response) => {
    try {
      const partyId = request.params.partyId
      const result = await context.agent.cmRemoveContact({ contactId: partyId })
      return response.send(result)
    } catch (error) {
      console.error(error)
      return sendErrorResponse(response, 500, 'Could not remove the party.')
    }
  })
}

export function partyTypeReadEndpoints(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    debug(`Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/party-types'
  router.get(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      // later we will add filter to this
      const partyTypes = await context.agent.cmGetContactTypes()
      response.statusCode = 200
      return response.send(partyTypes)
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
  router.get(`${path}/:partyTypeId`, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const partyTypeId = request.params.partyTypeId
      const partyType = await context.agent.cmGetContactType({ contactTypeId: partyTypeId })
      response.statusCode = 200
      return response.send(partyType)
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
