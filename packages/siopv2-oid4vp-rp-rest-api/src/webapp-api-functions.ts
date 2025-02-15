import { AuthorizationRequestState, AuthorizationResponseStateStatus } from '@sphereon/did-auth-siop'
import { checkAuth, ISingleEndpointOpts, sendErrorResponse } from '@sphereon/ssi-express-support'
import { AuthStatusResponse, GenerateAuthRequestURIResponse, uriWithBase } from '@sphereon/ssi-sdk.siopv2-oid4vp-common'
import { AuthorizationResponseStateWithVerifiedData, VerifiedDataMode } from '@sphereon/ssi-sdk.siopv2-oid4vp-rp-auth'
import { Request, Response, Router } from 'express'
import uuid from 'short-uuid'
import { ICreateAuthRequestWebappEndpointOpts, IRequiredContext } from './types'
import { shaHasher as defaultHasher } from '@sphereon/ssi-sdk.core'



export function createAuthRequestWebappEndpoint(router: Router, context: IRequiredContext, opts?: ICreateAuthRequestWebappEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`createAuthRequest Webapp endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/webapp/definitions/:definitionId/auth-requests'
  router.post(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      // if (!request.agent) throw Error('No agent configured')
      const definitionId = request.params.definitionId
      if (!definitionId) {
        return sendErrorResponse(response, 400, 'No definitionId query parameter provided')
      }
      const state: string = request.body.state ?? uuid.uuid()
      const correlationId = request.body.correlationId ?? state

      const requestByReferenceURI = uriWithBase(`/siop/definitions/${definitionId}/auth-requests/${state}`, {
        baseURI: opts?.siopBaseURI,
      })
      const responseURI = uriWithBase(`/siop/definitions/${definitionId}/auth-responses/${state}`, { baseURI: opts?.siopBaseURI })
      // first version is for backwards compat
      const responseRedirectURI = ('response_redirect_uri' in request.body && (request.body.response_redirect_uri as string | undefined)) ?? ('responseRedirectURI' in request.body && (request.body.responseRedirectURI as string | undefined))

      const authRequestURI = await context.agent.siopCreateAuthRequestURI({
        definitionId,
        correlationId,
        state,
        nonce: uuid.uuid(),
        requestByReferenceURI,
        responseURIType: 'response_uri',
        responseURI,
        ...(responseRedirectURI && { responseRedirectURI }),
      })
      const authRequestBody: GenerateAuthRequestURIResponse = {
        correlationId,
        state,
        definitionId,
        authRequestURI,
        authStatusURI: `${uriWithBase(opts?.webappAuthStatusPath ?? '/webapp/auth-status', { baseURI: opts?.webappBaseURI })}`,
      }
      console.log(`Auth Request URI data to send back: ${JSON.stringify(authRequestBody)}`)
      return response.json(authRequestBody)
    } catch (error) {
      return sendErrorResponse(response, 500, 'Could not create an authorization request URI', error)
    }
  })
}

export function authStatusWebappEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`authStatus Webapp endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/webapp/auth-status'
  router.post(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      console.log('Received auth-status request...')
      const correlationId: string = request.body.correlationId as string
      const definitionId: string = request.body.definitionId as string

      const requestState =
        correlationId && definitionId
          ? await context.agent.siopGetAuthRequestState({
              correlationId,
              definitionId,
              errorOnNotFound: false,
            })
          : undefined
      if (!requestState || !definitionId || !correlationId) {
        console.log(
          `No authentication request mapping could be found for the given URL. correlation: ${correlationId}, definitionId: ${definitionId}`,
        )
        response.statusCode = 404
        const statusBody: AuthStatusResponse = {
          status: requestState ? requestState.status : 'error',
          error: 'No authentication request mapping could be found for the given URL.',
          correlationId,
          definitionId,
          lastUpdated: requestState ? requestState.lastUpdated : Date.now(),
        }
        return response.json(statusBody)
      }

      let includeVerifiedData: VerifiedDataMode = VerifiedDataMode.NONE
      if ('includeVerifiedData' in request.body) {
        includeVerifiedData = request.body.includeVerifiedData as VerifiedDataMode
      }

      let responseState
      if (requestState.status === 'sent') {
        responseState = (await context.agent.siopGetAuthResponseState({
          correlationId,
          definitionId,
          includeVerifiedData: includeVerifiedData,
          errorOnNotFound: false,
        })) as AuthorizationResponseStateWithVerifiedData
      }
      const overallState: AuthorizationRequestState | AuthorizationResponseStateWithVerifiedData = responseState ?? requestState

      const statusBody: AuthStatusResponse = {
        status: overallState.status,
        ...(overallState.error ? { error: overallState.error?.message } : {}),
        correlationId,
        definitionId,
        lastUpdated: overallState.lastUpdated,
        ...(responseState && responseState.status === AuthorizationResponseStateStatus.VERIFIED
          ? {
              payload: await responseState.response.mergedPayloads({ hasher: defaultHasher }),
              verifiedData: responseState.verifiedData,
            }
          : {}),
      }
      console.debug(`Will send auth status: ${JSON.stringify(statusBody)}`)
      if (overallState.status === 'error') {
        response.statusCode = 500
        return response.json(statusBody)
      }
      response.statusCode = 200
      return response.json(statusBody)
    } catch (error) {
      return sendErrorResponse(response, 500, error.message, error)
    }
  })
}

export function removeAuthRequestStateWebappEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`removeAuthStatus Webapp endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/webapp/definitions/:definitionId/auth-requests/:correlationId'
  router.delete(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const correlationId: string = request.params.correlationId
      const definitionId: string = request.params.definitionId
      if (!correlationId || !definitionId) {
        console.log(`No authorization request could be found for the given url. correlationId: ${correlationId}, definitionId: ${definitionId}`)
        return sendErrorResponse(response, 404, 'No authorization request could be found')
      }
      response.statusCode = 200
      return response.json(await context.agent.siopDeleteAuthState({ definitionId, correlationId }))
    } catch (error) {
      return sendErrorResponse(response, 500, error.message, error)
    }
  })
}


export function getDefinitionsEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`getDefinitions Webapp endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/webapp/definitions'
  router.get(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const definitions = await context.agent.pdmGetDefinitions()
      response.statusCode = 200
      return response.json(definitions)
    } catch (error) {
      return sendErrorResponse(response, 500, error.message, error)
    }
  })
}
