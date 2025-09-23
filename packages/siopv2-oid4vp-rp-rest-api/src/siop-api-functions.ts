import { AuthorizationResponsePayload } from '@sphereon/did-auth-siop'
import { checkAuth, ISingleEndpointOpts, sendErrorResponse } from '@sphereon/ssi-express-support'
import { AuthorizationChallengeValidationResponse } from '@sphereon/ssi-sdk.siopv2-oid4vp-common'
import { CredentialMapper } from '@sphereon/ssi-types'
import { Request, Response, Router } from 'express'
import { IRequiredContext } from './types'

const parseAuthorizationResponse = (request: Request): AuthorizationResponsePayload => {
  const contentType = request.header('content-type')

  if (contentType === 'application/json') {
    const payload = typeof request.body === 'string' ? JSON.parse(request.body) : request.body
    return payload as AuthorizationResponsePayload
  }

  if (contentType === 'application/x-www-form-urlencoded') {
    const payload = request.body as AuthorizationResponsePayload

    // Parse presentation_submission if it's a string
    if (typeof payload.presentation_submission === 'string') {
      console.log(`Supplied presentation_submission was a string instead of JSON. Correcting, but external party should fix their implementation!`)
      payload.presentation_submission = JSON.parse(payload.presentation_submission)
    }

    // when using FORM_URL_ENCODED, vp_token comes back as string not matter whether the input was string, object or array. Handled below.
    if (typeof payload.vp_token === 'string') {
      const { vp_token } = payload

      // The only use case where vp_object is an object is JsonLdAsString atm. For arrays, any objects will be parsed along with the array
      // (Leaving the vp_token JsonLdAsString causes problems because the original credential will remain string and will be interpreted as JWT in some parts of the code)
      if ((vp_token.startsWith('[') && vp_token.endsWith(']')) || CredentialMapper.isJsonLdAsString(vp_token)) {
        payload.vp_token = JSON.parse(vp_token)
      }
    }

    return payload
  }

  throw new Error(
    `Unsupported content type: ${contentType}. Currently only application/x-www-form-urlencoded and application/json (for direct_post) are supported`,
  )
}

export function verifyAuthResponseSIOPv2Endpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`verifyAuthResponse SIOP endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/siop/definitions/:definitionId/auth-responses/:correlationId'
  router.post(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const { correlationId, queryId, tenantId, version } = request.params
      if (!correlationId || !queryId) {
        console.log(`No authorization request could be found for the given url. correlationId: ${correlationId}, queryId: ${queryId}`)
        return sendErrorResponse(response, 404, 'No authorization request could be found')
      }
      console.log('Authorization Response (siop-sessions')
      console.log(JSON.stringify(request.body, null, 2))
      const definitionItems = await context.agent.pdmGetDefinitions({ filter: [{ queryId, tenantId, version }] })
      if (definitionItems.length === 0) {
        console.log(`Could not get definition ${queryId} from agent. Will return 404`)
        response.statusCode = 404
        response.statusMessage = `No definition ${queryId}`
        return response.send()
      }

      const authorizationResponse = parseAuthorizationResponse(request)
      console.log(`URI: ${JSON.stringify(authorizationResponse)}`)

      const definitionItem = definitionItems[0]
      const verifiedResponse = await context.agent.siopVerifyAuthResponse({
        authorizationResponse,
        correlationId,
        queryId,
        dcqlQuery: definitionItem.query,
      })

      // FIXME SSISDK-55 add proper support for checking for DCQL presentations
      const presentation = verifiedResponse?.oid4vpSubmission?.presentation
      if (presentation && Object.keys(presentation).length > 0) {
        console.log('PRESENTATIONS:' + JSON.stringify(verifiedResponse?.oid4vpSubmission?.presentation, null, 2))
        response.statusCode = 200

        const authorizationChallengeValidationResponse: AuthorizationChallengeValidationResponse = {
          presentation_during_issuance_session: verifiedResponse.correlationId,
        }
        if (authorizationResponse.is_first_party) {
          response.setHeader('Content-Type', 'application/json')
          return response.send(JSON.stringify(authorizationChallengeValidationResponse))
        }

        const responseRedirectURI = await context.agent.siopGetRedirectURI({ correlationId, queryId: queryId, state: verifiedResponse.state })
        if (responseRedirectURI) {
          response.setHeader('Content-Type', 'application/json')
          return response.send(JSON.stringify({ redirect_uri: responseRedirectURI }))
        }
        // todo: delete session
      } else {
        console.log('Missing Presentation (Verifiable Credentials)')
        response.statusCode = 500
        response.statusMessage = 'Missing Presentation (Verifiable Credentials)'
      }
      return response.send()
    } catch (error) {
      console.error(error)
      return sendErrorResponse(response, 500, 'Could not verify auth status', error)
    }
  })
}

export function getAuthRequestSIOPv2Endpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`getAuthRequest SIOP endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/siop/definitions/:definitionId/auth-requests/:correlationId'
  router.get(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const correlationId = request.params.correlationId
      const definitionId = request.params.definitionId
      if (!correlationId || !definitionId) {
        console.log(`No authorization request could be found for the given url. correlationId: ${correlationId}, definitionId: ${definitionId}`)
        return sendErrorResponse(response, 404, 'No authorization request could be found')
      }
      const requestState = await context.agent.siopGetAuthRequestState({
        correlationId,
        queryId: definitionId,
        errorOnNotFound: false,
      })
      if (!requestState) {
        console.log(
          `No authorization request could be found for the given url in the state manager. correlationId: ${correlationId}, definitionId: ${definitionId}`,
        )
        return sendErrorResponse(response, 404, `No authorization request could be found`)
      }
      const requestObject = await requestState.request?.requestObject?.toJwt()
      console.log('JWT Request object:')
      console.log(requestObject)

      let error: string | undefined
      try {
        response.statusCode = 200
        response.setHeader('Content-Type', 'application/jwt')
        return response.send(requestObject)
      } catch (e) {
        error = typeof e === 'string' ? e : e instanceof Error ? e.message : undefined
        return sendErrorResponse(response, 500, 'Could not get authorization request', e)
      } finally {
        await context.agent.siopUpdateAuthRequestState({
          correlationId,
          queryId: definitionId,
          state: 'authorization_request_created',
          error,
        })
      }
    } catch (error) {
      return sendErrorResponse(response, 500, 'Could not get authorization request', error)
    }
  })
}
