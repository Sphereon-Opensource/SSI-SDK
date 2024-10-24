import { checkAuth, ISingleEndpointOpts, sendErrorResponse } from '@sphereon/ssi-express-support'
import { ISphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { contextHasPlugin } from '@sphereon/ssi-sdk.agent-config'
import { Request, Response, Router } from 'express'
import { JKWS_HOSTING_ALL_KEYS_PATH, JWKS_HOSTING_DID_KEYS_PATH } from './environment'
import { toJWKS } from './functions'
import { logger } from './index'
import { IRequiredContext } from './types'

export function getAllJWKSEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    logger.info(`Get all JWKS endpoint is disabled`)
    return
  }

  const path = opts?.path ?? JKWS_HOSTING_ALL_KEYS_PATH
  logger.info(`All JWKS endpoint enabled, path ${path}`)
  router.get(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      if (!contextHasPlugin<ISphereonKeyManager>(context, 'keyManagerListKeys')) {
        return sendErrorResponse(response, 500, 'Key manager plugin that can list keys is not found. Please enable the Sphereon Key Manager plugin if you want to use this endpoint')
      }
      response.statusCode = 202
      const keys = await context.agent.keyManagerListKeys()
      return response.send(toJWKS({ keys }))
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}

export function getDIDJWKSEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    logger.info(`Get DID JWKS endpoint is disabled`)
    return
  }
  const path = opts?.path ?? JWKS_HOSTING_DID_KEYS_PATH
  console.info(`DID JWKS endpoint enabled, path ${path}`)
  router.get(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    const did = request.params.did
    try {
      console.log(`Will get JWKS for DID ${did}`)
      const resolution = await context.agent.identifierManagedGetByDid({ identifier: did })
      if (!resolution.identifier) {
        return sendErrorResponse(response, 404, `DID ${did} not found`)
      }
      response.statusCode = 200
      return response.send(toJWKS({ keys: resolution.keys }))
    } catch (e) {
      console.log(e)
      return sendErrorResponse(response, 404, `DID ${did} not found`)
    }
  })
}
