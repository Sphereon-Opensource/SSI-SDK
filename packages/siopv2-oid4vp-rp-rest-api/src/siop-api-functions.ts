import { AuthorizationResponsePayload, PresentationDefinitionLocation } from '@sphereon/did-auth-siop'
import { checkAuth, ISingleEndpointOpts, sendErrorResponse } from '@sphereon/ssi-express-support'
import { PresentationSubmission } from '@sphereon/ssi-types'
import { Request, Response, Router } from 'express'
import { IRequiredContext } from './types'

export function verifyAuthResponseSIOPv2Endpoint(
  router: Router,
  context: IRequiredContext,
  opts?: ISingleEndpointOpts & { presentationDefinitionLocation?: PresentationDefinitionLocation },
) {
  if (opts?.enabled === false) {
    console.log(`verifyAuthResponse SIOP endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/siop/definitions/:definitionId/auth-responses/:correlationId'
  router.post(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const { correlationId, definitionId, tenantId, version } = request.params
      if (!correlationId || !definitionId) {
        console.log(`No authorization request could be found for the given url. correlationId: ${correlationId}, definitionId: ${definitionId}`)
        return sendErrorResponse(response, 404, 'No authorization request could be found')
      }
      console.log('Authorization Response (siop-sessions')
      console.log(JSON.stringify(request.body, null, 2))
      const definitionItems = await context.agent.pdmGetDefinitions({ filter: [{ definitionId, tenantId, version }] })
      if (definitionItems.length === 0) {
        console.log(`Could not get definition ${definitionId} from agent. Will return 404`)
        response.statusCode = 404
        response.statusMessage = `No definition ${definitionId}`
        return response.send()
      }

      const authorizationResponse =
        typeof request.body === 'string' ? (JSON.parse(request.body) as AuthorizationResponsePayload) : (request.body as AuthorizationResponsePayload)
      if (typeof authorizationResponse.presentation_submission === 'string') {
        console.log(`Supplied presentation_submission was a string instead of JSON. Correcting, but external party should fix their implementation!`)
        authorizationResponse.presentation_submission = JSON.parse(authorizationResponse.presentation_submission) as PresentationSubmission
      }
      console.log(`URI: ${JSON.stringify(authorizationResponse)}`)

      const definition = definitionItems[0].definitionPayload
      const verifiedResponse = await context.agent.siopVerifyAuthResponse({
        authorizationResponse,
        correlationId,
        definitionId,
        presentationDefinitions: [
          {
            location: opts?.presentationDefinitionLocation ?? PresentationDefinitionLocation.TOPLEVEL_PRESENTATION_DEF,
            definition,
          },
        ],
      })

      const wrappedPresentation = verifiedResponse?.oid4vpSubmission?.presentations[0]
      if (wrappedPresentation) {
        // const credentialSubject = wrappedPresentation.presentation.verifiableCredential[0]?.credential?.credentialSubject
        // console.log(JSON.stringify(credentialSubject, null, 2))
        console.log('PRESENTATION:' + JSON.stringify(wrappedPresentation.presentation, null, 2))
        response.statusCode = 200
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
        definitionId,
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
        return response.send(requestObject)
      } catch (e) {
        error = typeof e === 'string' ? e : e instanceof Error ? e.message : undefined
        return sendErrorResponse(response, 500, 'Could not get authorization request', e)
      } finally {
        await context.agent.siopUpdateAuthRequestState({
          correlationId,
          definitionId,
          state: 'sent',
          error,
        })
      }
    } catch (error) {
      return sendErrorResponse(response, 500, 'Could not get authorization request', error)
    }
  })
}
