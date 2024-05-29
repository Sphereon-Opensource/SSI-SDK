import { checkAuth, sendErrorResponse, ISingleEndpointOpts } from '@sphereon/ssi-express-support'
import { Request, Response, Router } from 'express'
import { IRequiredContext } from './types'
import { AddDefinitionItemArgs, PersistDefinitionArgs, UpdateDefinitionItemArgs } from '@sphereon/ssi-sdk.pd-manager'
import { DeleteDefinitionArgs } from '@sphereon/ssi-sdk.data-store'

const operation = '/presentation-definitions'

export function pdReadEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`"pdReadEndpoint" Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? operation
  router.get(`${path}/:itemId`, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const itemId = request.params.itemId
      const pd = await context.agent.pdmGetDefinition({ itemId: itemId })
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
  const path = opts?.path ?? operation
  router.post(path, async (request: Request, response: Response) => {
    try {
      const addPd = request.body
      const pd = await context.agent.pdmAddDefinition(addPd as AddDefinitionItemArgs)
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
  const path = opts?.path ?? operation
  router.put(`${path}/:itemId`, async (request: Request, response: Response) => {
    try {
      const updatePd = request.body
      const itemId = request.params.itemId
      if (itemId !== updatePd.itemId) {
        throw new Error(`path item id not matching the payload's item id`)
      }

      const pd = await context.agent.pdmUpdateDefinition(updatePd as UpdateDefinitionItemArgs)
      response.statusCode = 200
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
  const path = opts?.path ?? operation
  router.delete(`${path}/:itemId`, async (request, response) => {
    try {
      const itemId = request.params.itemId
      const result = await context.agent.pdmDeleteDefinition({ itemId: itemId } as DeleteDefinitionArgs)
      response.statusCode = 200
      return response.send(result)
    } catch (error) {
      return sendErrorResponse(response, 500, error.message, error)
    }
  })
}

export function pdPersistEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`"pdPersistEndpoint" Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/presentation-defiinitions/persist'
  router.post(path, async (request: Request, response: Response) => {
    try {
      const addPd = request.body
      const pd = await context.agent.pdmPersistDefinitionItem(addPd as PersistDefinitionArgs)
      response.statusCode = 201
      return response.send(pd)
    } catch (error) {
      return sendErrorResponse(response, 500, error.message, error)
    }
  })
}
