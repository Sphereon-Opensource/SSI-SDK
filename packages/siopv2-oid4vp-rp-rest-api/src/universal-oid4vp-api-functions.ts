import { AuthorizationResponseStateStatus } from '@sphereon/did-auth-siop'
import { checkAuth, ISingleEndpointOpts, sendErrorResponse } from '@sphereon/ssi-express-support'
import { uriWithBase } from '@sphereon/ssi-sdk.siopv2-oid4vp-common'
import { Request, Response, Router } from 'express'
import uuid from 'short-uuid'
import { validateData } from './middleware/validationMiddleware'
import { CreateAuthorizationRequestBodySchema } from './schemas'
import {
  CreateAuthorizationRequest,
  CreateAuthorizationRequestResponse,
  CreateAuthorizationResponse,
  DeleteAuthorizationRequest,
  GetAuthorizationRequestStatus,
  AuthStatusResponse,
  ICreateAuthRequestWebappEndpointOpts,
  IRequiredContext
} from './types'

export function createAuthRequestUniversalOID4VPEndpoint(router: Router, context: IRequiredContext, opts?: ICreateAuthRequestWebappEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`createAuthRequest universal OID4VP endpoint is disabled`)
    return
  }

  const path = opts?.path ?? '/backend/auth/requests'
  router.post(path, checkAuth(opts?.endpoint), validateData(CreateAuthorizationRequestBodySchema), async (request: CreateAuthorizationRequest, response: CreateAuthorizationResponse) => {
    try {
      const correlationId = request.body.correlation_id ?? uuid.uuid()
      const qrCodeOpts = request.body.qr_code ?? opts?.qrCodeOpts
      const queryId = request.body.query_id
      const directPostResponseRedirectUri = request.body.direct_post_response_redirect_uri // TODO Uri not URI
      const requestUriBase = request.body.request_uri_base
      const callback = request.body.callback

      const definitionItems = await context.agent.pdmGetDefinitions({ filter: [{ definitionId: queryId }] })
      if (definitionItems.length === 0) {
          console.log(`No query could be found for the given id. Query id: ${queryId}`)
          return sendErrorResponse(response, 404, { status: 404, message: 'No query could be found' })
      }

      const requestByReferenceURI = uriWithBase(`/siop/definitions/${queryId}/auth-requests/${correlationId}`, {
        baseURI: requestUriBase ?? opts?.siopBaseURI,
      })
      const responseURI = uriWithBase(`/siop/definitions/${queryId}/auth-responses/${correlationId}`, { baseURI: opts?.siopBaseURI })

      const authRequestURI = await context.agent.siopCreateAuthRequestURI({
        queryId,
        correlationId,
        nonce: uuid.uuid(),
        requestByReferenceURI,
        responseURIType: 'response_uri',
        responseURI,
        ...(directPostResponseRedirectUri && { responseRedirectURI: directPostResponseRedirectUri }),
        callback
      })

      let qrCodeDataUri: string | undefined
      if (qrCodeOpts) {
        const { AwesomeQR } = await import('awesome-qr')
        const qrCode = new AwesomeQR({ ...qrCodeOpts, text: authRequestURI })
        qrCodeDataUri = `data:image/png;base64,${(await qrCode.draw())!.toString('base64')}`
      }

      const authRequestBody = {
        query_id: queryId,
        correlation_id: correlationId,
        request_uri: authRequestURI,
        status_uri: `${uriWithBase(opts?.webappAuthStatusPath ?? `/backend/auth/status/${correlationId}`, { baseURI: opts?.webappBaseURI })}`,
        ...(qrCodeDataUri && { qr_uri: qrCodeDataUri }),
      } satisfies CreateAuthorizationRequestResponse
      console.log(`Auth Request URI data to send back: ${JSON.stringify(authRequestBody)}`)

      return response.status(201).json(authRequestBody)
    } catch (error) {
      return sendErrorResponse(response, 500, { status: 500, message: 'Could not create an authorization request URI' }, error)
    }
  })
}

export function removeAuthRequestStateUniversalOID4VPEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`removeAuthStatus universal OID4VP endpoint is disabled`)
    return
  }

  const path = opts?.path ?? '/backend/auth/requests/:correlationId'
  router.delete(path, checkAuth(opts?.endpoint), async (request: DeleteAuthorizationRequest, response: Response) => {
    try {
      const correlationId: string = request.params.correlationId

      const authRequestState = await context.agent.siopGetAuthRequestState({
        correlationId,
        errorOnNotFound: false
      })
      if (!authRequestState) {
        console.log(`No authorization request could be found for the given correlationId. correlationId: ${correlationId}`)
        return sendErrorResponse(response, 404, { status: 404, message: 'No authorization request could be found' })
      }

      await context.agent.siopDeleteAuthState({ correlationId })

      return response.status(204).json()
    } catch (error) {
      return sendErrorResponse(response, 500, { status: 500, message: error.message }, error)
    }
  })
}

export function authStatusUniversalOID4VPEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`authStatus universal OID4VP endpoint is disabled`)
    return
  }

  const path = opts?.path ?? '/backend/auth/status/:correlationId'
  router.get(path, checkAuth(opts?.endpoint), async (request: GetAuthorizationRequestStatus, response: Response) => {
    try {
      console.log('Received auth-status request...')
      const correlationId: string = request.params.correlationId

      const requestState = await context.agent.siopGetAuthRequestState({
        correlationId,
        errorOnNotFound: false
      })

      if (!requestState) {
        console.log(`No authorization request could be found for the given correlationId. correlationId: ${correlationId}`)
        return sendErrorResponse(response, 404, { status: 404, message: 'No authorization request could be found' })
      }

      let responseState
      if (requestState.status === 'authorization_request_created') {
        responseState = (await context.agent.siopGetAuthResponseState({ correlationId, errorOnNotFound: false }))
      }
      const overallState = responseState ?? requestState

      const statusBody = {
        status: overallState.status,
        correlation_id: overallState.correlationId,
        query_id: overallState.queryId,
        last_updated: overallState.lastUpdated,
        ...((responseState?.status === AuthorizationResponseStateStatus.VERIFIED && responseState.verifiedData !== undefined) && { verified_data: responseState.verifiedData }),
        ...(overallState.error && { message: overallState.error.message })
      } satisfies AuthStatusResponse
      console.debug(`Will send auth status: ${JSON.stringify(statusBody)}`)

      if (overallState.status === 'error') {
        return response.status(500).json(statusBody)
      }
      return response.status(200).json(statusBody)
    } catch (error) {
      return sendErrorResponse(response, 500, { status: 500, message: error.message }, error)
    }
  })
}

export function getDefinitionsEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`getDefinitions universal OID4VP endpoint is disabled`)
    return
  }

  const path = opts?.path ?? '/backend/definitions'
  router.get(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const definitions = await context.agent.pdmGetDefinitions()
      response.statusCode = 200
      return response.json(definitions)
    } catch (error) {
      return sendErrorResponse(response, 500, { status: 500, message: error.message }, error)
    }
  })
}
