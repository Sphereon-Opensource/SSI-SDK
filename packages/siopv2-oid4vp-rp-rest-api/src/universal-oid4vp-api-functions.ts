import {
  AuthorizationRequestStateStatus,
  CreateAuthorizationRequest,
  createAuthorizationRequestFromPayload,
  CreateAuthorizationRequestPayloadSchema,
  CreateAuthorizationResponsePayload,
} from '@sphereon/did-auth-siop'
import { checkAuth, ISingleEndpointOpts, sendErrorResponse } from '@sphereon/ssi-express-support'
import { uriWithBase } from '@sphereon/ssi-sdk.siopv2-oid4vp-common'
import { Request, Response, Router } from 'express'
import uuid from 'short-uuid'
import { validateData } from './middleware/validationMiddleware'
import { buildQueryIdFilter } from './siop-api-functions'
import {
  AuthStatusResponse,
  CreateAuthorizationRequestPayloadRequest,
  CreateAuthorizationResponsePayloadResponse,
  DeleteAuthorizationRequest,
  GetAuthorizationRequestStatus,
  ICreateAuthRequestWebappEndpointOpts,
  IRequiredContext,
  QRCodeOpts,
} from './types'

export function createAuthRequestUniversalOID4VPEndpoint(router: Router, context: IRequiredContext, opts?: ICreateAuthRequestWebappEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`createAuthRequest universal OID4VP endpoint is disabled`)
    return
  }

  const path = opts?.path ?? '/backend/auth/requests'
  router.post(
    path,
    checkAuth(opts?.endpoint),
    validateData(CreateAuthorizationRequestPayloadSchema),
    async (request: CreateAuthorizationRequestPayloadRequest, response: CreateAuthorizationResponsePayloadResponse) => {
      try {
        const authRequest: CreateAuthorizationRequest = createAuthorizationRequestFromPayload(request.body)
        const correlationId = authRequest.correlationId ?? uuid.uuid()
        const qrCodeOpts = authRequest.qrCode ? ({ ...authRequest.qrCode } satisfies QRCodeOpts) : opts?.qrCodeOpts
        const queryId = authRequest.queryId

        const definitionItems = await context.agent.pdmGetDefinitions({
          filter: buildQueryIdFilter(queryId),
        })
        if (definitionItems.length === 0) {
          console.log(`No query could be found for the given id. Query id: ${queryId}`)
          return sendErrorResponse(response, 404, { status: 404, message: 'No query could be found' })
        }

        const requestByReferenceURI = uriWithBase(`/siop/queries/${queryId}/auth-requests/${correlationId}`, {
          baseURI: authRequest.requestUriBase ?? opts?.siopBaseURI,
        })
        const responseURI = uriWithBase(`/siop/queries/${queryId}/auth-responses/${correlationId}`, { baseURI: opts?.siopBaseURI })

        const authRequestURI = await context.agent.siopCreateAuthRequestURI({
          queryId,
          correlationId,
          nonce: uuid.uuid(),
          requestByReferenceURI,
          responseURIType: 'response_uri',
          responseURI,
          ...(authRequest.directPostResponseRedirectUri && { responseRedirectURI: authRequest.directPostResponseRedirectUri }),
          ...(authRequest.callback && { callback: authRequest.callback }),
        })

        let qrCodeDataUri: string | undefined
        if (qrCodeOpts) {
          const { AwesomeQR } = await import('awesome-qr')
          const qrCode = new AwesomeQR({ ...qrCodeOpts, text: authRequestURI })
          qrCodeDataUri = `data:image/png;base64,${(await qrCode.draw())!.toString('base64')}`
        } else {
          qrCodeDataUri = authRequestURI
        }

        const authRequestBody = {
          query_id: queryId,
          correlation_id: correlationId,
          request_uri: authRequestURI,
          status_uri: `${uriWithBase(opts?.webappAuthStatusPath ?? `/backend/auth/status/${correlationId}`, { baseURI: opts?.webappBaseURI })}`,
          ...(qrCodeDataUri && { qr_uri: qrCodeDataUri }),
        } satisfies CreateAuthorizationResponsePayload
        console.log(`Auth Request URI data to send back: ${JSON.stringify(authRequestBody)}`)

        return response.status(201).json(authRequestBody)
      } catch (error) {
        return sendErrorResponse(response, 500, { status: 500, message: 'Could not create an authorization request URI' }, error)
      }
    },
  )
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
        errorOnNotFound: false,
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
        errorOnNotFound: false,
      })

      if (!requestState) {
        console.log(`No authorization request could be found for the given correlationId. correlationId: ${correlationId}`)
        return sendErrorResponse(response, 404, { status: 404, message: 'No authorization request could be found' })
      }

      let responseState
      if (requestState.status === AuthorizationRequestStateStatus.RETRIEVED) {
        responseState = await context.agent.siopGetAuthResponseState({
          correlationId,
          errorOnNotFound: false,
        })
      }
      const overallState = responseState ?? requestState

      const statusBody = {
        status: overallState.status,
        correlation_id: overallState.correlationId,
        query_id: overallState.queryId,
        last_updated: overallState.lastUpdated,
        ...('verifiedData' in overallState && { verified_data: overallState.verifiedData }),
        ...(overallState.error && { message: overallState.error.message }),
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
