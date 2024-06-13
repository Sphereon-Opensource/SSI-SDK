import { checkAuth, sendErrorResponse, ISingleEndpointOpts } from '@sphereon/ssi-express-support'
import { Request, Response, Router } from 'express'
import { IRequiredContext } from './types'
import { AddContactArgs } from '@sphereon/ssi-sdk.contact-manager'

export function partiesReadEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`"partiesReadEndpoint" Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/parties'
  router.get(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      // later we will add filter to this
      const parties = await context.agent.cmGetContacts()
      response.statusCode = 200
      return response.send(parties)
    } catch (error) {
      return sendErrorResponse(response, 500, error.message as string, error)
    }
  })
}

export function partyReadEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`"partyReadEndpoint" Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/parties'
  router.get(`${path}/:partyId`, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const partyId = request.params.partyId
      const party = await context.agent.cmGetContact({ contactId: partyId })
      response.statusCode = 200
      return response.send(party)
    } catch (error) {
      return sendErrorResponse(response, 500, error.message as string, error)
    }
  })
}

export function partyWriteEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`"partyWriteEndpoint" Endpoint is disabled`)
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
      return sendErrorResponse(response, 500, error.message, error)
    }
  })
}

export function partyDeleteEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`"partyDeleteEndpoint" Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/parties'
  router.delete(`${path}/:partyId`, async (request, response) => {
    try {
      const partyId = request.params.partyId
      const result = await context.agent.cmRemoveContact({ contactId: partyId })
      response.statusCode = 200
      return response.send(result)
    } catch (error) {
      return sendErrorResponse(response, 500, error.message, error)
    }
  })
}

export function partiesTypeReadEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`"partiesTypeReadEndpoint" Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/party-types'
  router.get(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      // later we will add filter to this
      const partyTypes = await context.agent.cmGetContactTypes()
      response.statusCode = 200
      return response.send(partyTypes)
    } catch (error) {
      return sendErrorResponse(response, 500, error.message as string, error)
    }
  })
}

export function partyTypeReadEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`"partyTypeReadEndpoint" Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/party-types'
  router.get(`${path}/:partyTypeId`, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const partyTypeId = request.params.partyTypeId
      const partyType = await context.agent.cmGetContactType({ contactTypeId: partyTypeId })
      response.statusCode = 200
      return response.send(partyType)
    } catch (error) {
      return sendErrorResponse(response, 500, error.message as string, error)
    }
  })
}

export function identitiesReadEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`"identitiesReadEndpoint" Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/identities'
  router.get(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      // later we will add filter to this
      const identities = await context.agent.cmGetIdentities()
      response.statusCode = 200
      return response.send(identities)
    } catch (error) {
      return sendErrorResponse(response, 500, error.message as string, error)
    }
  })
}

export function identityReadEndpoints(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`"identityReadEndpoints" Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/identities'
  router.get(`${path}/:identityId`, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const identityId = request.params.identityId
      const identity = await context.agent.cmGetIdentity({ identityId })
      response.statusCode = 200
      return response.send(identity)
    } catch (error) {
      return sendErrorResponse(response, 500, error.message as string, error)
    }
  })
}
