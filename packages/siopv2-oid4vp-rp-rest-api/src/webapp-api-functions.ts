import { AuthorizationRequestState, AuthorizationResponseStateStatus, AuthorizationResponseStateWithVerifiedData } from '@sphereon/did-auth-siop'
import { checkAuth, ISingleEndpointOpts, sendErrorResponse } from '@sphereon/ssi-express-support'
import { AuthStatusResponse, GenerateAuthRequestURIResponse, uriWithBase } from '@sphereon/ssi-sdk.siopv2-oid4vp-common'
import { VerifiedDataMode } from '@sphereon/ssi-sdk.siopv2-oid4vp-rp-auth'
import { shaHasher as defaultHasher } from '@sphereon/ssi-sdk.core'
import { Request, Response, Router } from 'express'
import uuid from 'short-uuid'
import { ICreateAuthRequestWebappEndpointOpts, IRequiredContext } from './types'

export function createAuthRequestWebappEndpoint(router: Router, context: IRequiredContext, opts?: ICreateAuthRequestWebappEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`createAuthRequest Webapp endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/webapp/queries/:queryId/auth-requests'
  router.post(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      // if (!request.agent) throw Error('No agent configured')
      const queryId = request.params.queryId
      if (!queryId) {
        return sendErrorResponse(response, 400, 'No queryId query parameter provided')
      }
      const state: string = request.body.state ?? uuid.uuid()
      const correlationId = request.body.correlationId ?? state
      const qrCodeOpts = request.body.qrCodeOpts ?? opts?.qrCodeOpts

      const requestByReferenceURI = uriWithBase(`/siop/queries/${queryId}/auth-requests/${state}`, {
        baseURI: opts?.siopBaseURI,
      })
      const responseURI = uriWithBase(`/siop/queries/${queryId}/auth-responses/${state}`, { baseURI: opts?.siopBaseURI })
      // first version is for backwards compat
      const responseRedirectURI =
        ('response_redirect_uri' in request.body && (request.body.response_redirect_uri as string | undefined)) ??
        ('responseRedirectURI' in request.body && (request.body.responseRedirectURI as string | undefined))

      const authRequestURI = await context.agent.siopCreateAuthRequestURI({
        queryId,
        correlationId,
        state,
        nonce: uuid.uuid(),
        requestByReferenceURI,
        responseURIType: 'response_uri',
        responseURI,
        ...(responseRedirectURI && { responseRedirectURI }),
      })

      let qrCodeDataUri: string | undefined
      if (qrCodeOpts) {
        const { AwesomeQR } = await import('awesome-qr')
        const qrCode = new AwesomeQR({ ...qrCodeOpts, text: authRequestURI })
        qrCodeDataUri = `data:image/png;base64,${(await qrCode.draw())!.toString('base64')}`
      }
      const authRequestBody: GenerateAuthRequestURIResponse = {
        correlationId,
        state,
        queryId,
        authRequestURI,
        authStatusURI: `${uriWithBase(opts?.webappAuthStatusPath ?? '/webapp/auth-status', { baseURI: opts?.webappBaseURI })}`,
        ...(qrCodeDataUri && { qrCodeDataUri }),
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
      const queryId: string = request.body.queryId as string

      const requestState =
        correlationId && queryId
          ? await context.agent.siopGetAuthRequestState({
              correlationId,
              queryId,
              errorOnNotFound: false,
            })
          : undefined
      if (!requestState || !queryId || !correlationId) {
        console.log(`No authentication request mapping could be found for the given URL. correlation: ${correlationId}, queryId: ${queryId}`)
        response.statusCode = 404
        const statusBody: AuthStatusResponse = {
          status: requestState ? requestState.status : 'error',
          error: 'No authentication request mapping could be found for the given URL.',
          correlationId,
          queryId,
          lastUpdated: requestState ? requestState.lastUpdated : Date.now(),
        }
        return response.json(statusBody)
      }

      let includeVerifiedData: VerifiedDataMode = VerifiedDataMode.NONE
      if ('includeVerifiedData' in request.body) {
        includeVerifiedData = request.body.includeVerifiedData as VerifiedDataMode
      }

      let responseState
      if (requestState.status === 'authorization_request_retrieved') {
        responseState = (await context.agent.siopGetAuthResponseState({
          correlationId,
          queryId,
          includeVerifiedData: includeVerifiedData,
          errorOnNotFound: false,
        })) as AuthorizationResponseStateWithVerifiedData
      }
      const overallState: AuthorizationRequestState | AuthorizationResponseStateWithVerifiedData = responseState ?? requestState

      const statusBody: AuthStatusResponse = {
        status: overallState.status,
        ...(overallState.error ? { error: overallState.error?.message } : {}),
        correlationId,
        queryId,
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
  const path = opts?.path ?? '/webapp/queries/:queryId/auth-requests/:correlationId'
  router.delete(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const correlationId: string = request.params.correlationId
      const queryId: string = request.params.queryId
      if (!correlationId || !queryId) {
        console.log(`No authorization request could be found for the given url. correlationId: ${correlationId}, queryId: ${queryId}`)
        return sendErrorResponse(response, 404, 'No authorization request could be found')
      }
      response.statusCode = 200
      return response.json(await context.agent.siopDeleteAuthState({ queryId, correlationId }))
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
  const path = opts?.path ?? '/webapp/queries'
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
