import { checkAuth, sendErrorResponse, ISingleEndpointOpts } from '@sphereon/ssi-express-support'
import { Request, Response, Router } from 'express'
import { IRequiredContext } from './types'
import { AddPDArgs, UpdatePDArgs } from '@sphereon/ssi-sdk.pd-manager'
import { DeletePDArgs } from '@sphereon/ssi-sdk.data-store'

export function pdsReadEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`"pdReadEndpoint" Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/presentation-defs'
  router.get(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      // later we will add filter to this
      const pds = await context.agent.pdmGetDefinitions()
      response.statusCode = 200
      return response.send(pds)
    } catch (error) {
      return sendErrorResponse(response, 500, error.message as string, error)
    }
  })
}

export function pdReadEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`"pdReadEndpoint" Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/presentation-defs'
  router.get(`${path}/:pdId`, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const pdId = request.params.pdId
      const pd = await context.agent.pdmGetDefinition({ itemId: pdId })
      response.statusCode = 200
      return response.send(pd)
    } catch (error) {
      return sendErrorResponse(response, 500, error.message as string, error)
    }
  })
}

export function pdAddEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`"pdAddEndpoint" Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/presentation-defs'
  router.post(path, async (request: Request, response: Response) => {
    try {
      const addPd = request.body
      const pd = await context.agent.pdmAddDefinition(addPd as AddPDArgs)
      response.statusCode = 201
      return response.send(pd)
    } catch (error) {
      return sendErrorResponse(response, 500, error.message, error)
    }
  })
}

export function pdUpdateEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`"pdAddEndpoint" Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/presentation-defs'
  router.post(path, async (request: Request, response: Response) => {
    try {
      const updatePd = request.body
      const pd = await context.agent.pdmUpdateDefinition(updatePd as UpdatePDArgs)
      response.statusCode = 201
      return response.send(pd)
    } catch (error) {
      return sendErrorResponse(response, 500, error.message, error)
    }
  })
}

export function pdDeleteEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`"pdDeleteEndpoint" Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/presentation-defs'
  router.delete(`${path}/:pdItemId`, async (request, response) => {
    try {
      const pdItemId = request.params.pdItemId
      const result = await context.agent.pdmDeleteDefinition({ itemId: pdItemId } as DeletePDArgs)
      return response.send(result)
    } catch (error) {
      return sendErrorResponse(response, 500, error.message, error)
    }
  })
}
