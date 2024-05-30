import { checkAuth, ISingleEndpointOpts, sendErrorResponse } from '@sphereon/ssi-express-support'
import { Request, Response, Router } from 'express'
import { IRequiredContext } from './types'
import { PersistDefinitionArgs } from '@sphereon/ssi-sdk.pd-manager'
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

export function pdPersistEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`"pdPersistEndpoint" Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/presentation-defiinitions'
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
