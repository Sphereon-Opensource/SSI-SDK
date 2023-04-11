// noinspection JSUnusedGlobalSymbols

import * as dotenv from 'dotenv-flow'
import express, { Express, Response } from 'express'
import cookieParser from 'cookie-parser'
import uuid from 'short-uuid'
// import * as core from "express-serve-static-core";
import {
  AuthorizationRequestState,
  AuthorizationResponseState,
  AuthorizationResponseStateStatus,
  PresentationDefinitionLocation,
  VerifiedAuthorizationResponse,
} from '@sphereon/did-auth-siop'
import bodyParser from 'body-parser'
import {
  AuthorizationRequestStateStatus,
  AuthStatusResponse,
  GenerateAuthRequestURIResponse,
  uriWithBase,
} from '@sphereon/ssi-sdk-siopv2-oid4vp-common'
import { ISIOPv2RP } from '@sphereon/ssi-sdk-siopv2-oid4vp-rp-auth'
import { RequestWithAgent } from './request-agent-router'
import { TAgent } from '@veramo/core'
import { IPresentationExchange } from '@sphereon/ssi-sdk-presentation-exchange'

export class SIOPv2RPRestAPI {
  public express: Express
  private agent: TAgent<IPresentationExchange & ISIOPv2RP>


  constructor(agent: TAgent<IPresentationExchange & ISIOPv2RP>) {
    this.agent = agent
    dotenv.config()

    this.express = express()
    const port = process.env.PORT || 5000
    const secret = process.env.COOKIE_SIGNING_KEY

    this.express.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*')
      // Request methods you wish to allow
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')

      // Request headers you wish to allow
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')

      // Set to true if you need the website to include cookies in the requests sent
      // to the API (e.g. in case you use sessions)
      res.setHeader('Access-Control-Allow-Credentials', 'true')
      next()
    })
    // this.express.use(cors({ credentials: true }));
    // this.express.use('/proxy', proxy('www.gssoogle.com'));
    this.express.use(bodyParser.urlencoded({ extended: true }))
    this.express.use(bodyParser.json())
    this.express.use(cookieParser(secret))
    this.express.listen(port as number, '0.0.0.0', () => console.log(`Listening on port ${port}`))

    // Webapp endpoints
    this.createAuthRequestWebappEndpoint()
    this.authStatusWebappEndpoint()
    this.deleteAuthRequestStateWebappEndpoint()

    // SIOPv2 endpoints
    this.getAuthRequestSIOPv2Endpoint()
    this.verifyAuthResponseSIOPv2Endpoint()
  }

  private static sendErrorResponse(response: Response, statusCode: number, message: string) {
    response.statusCode = statusCode
    response.status(statusCode).send(message)
  }

  private deleteAuthRequestStateWebappEndpoint() {
    this.express.delete('/webapp/definitions/:definitionId/auth-requests/:correlationId', async (request, response) => {
      const correlationId: string = request.params.correlationId
      const definitionId: string = request.params.definitionId
      if (!correlationId || !definitionId) {
        console.log(`No authorization request could be found for the given url. correlationId: ${correlationId}, definitionId: ${definitionId}`)
        return SIOPv2RPRestAPI.sendErrorResponse(response, 404, 'No authorization request could be found')
      }
      response.statusCode = 200
      return response.send(this.agent.siopDeleteAuthState({ definitionId, correlationId }))
    })
  }

  private authStatusWebappEndpoint() {
    this.express.post('/webapp/auth-status', async (request: RequestWithAgent, response) => {
      console.log('Received auth-status request...')
      const correlationId: string = request.body.correlationId as string
      const definitionId: string = request.body.definitionId as string
      const requestState = correlationId && definitionId ? await this.agent.siopGetAuthRequestState({
        correlationId,
        definitionId,
        errorOnNotFound: false,
      }) : undefined
      if (!requestState || !definitionId || !correlationId) {
        console.log(
          `No authentication request mapping could be found for the given URL. correlation: ${correlationId}, definitionId: ${definitionId}`,
        )
        response.statusCode = 404

        const statusBody: AuthStatusResponse = {
          status: requestState ? requestState.status : AuthorizationRequestStateStatus.ERROR,
          error: 'No authentication request mapping could be found for the given URL.',
          correlationId,
          definitionId,
          lastUpdated: requestState ? requestState.lastUpdated : Date.now(),
        }
        return response.send(statusBody)
      }

      let responseState
      if (requestState.status === 'sent') {
        responseState = await this.agent.siopGetAuthResponseState({
          correlationId,
          definitionId,
          errorOnNotFound: false,
        })
      }
      const overallState: AuthorizationRequestState | AuthorizationResponseState = responseState ?? requestState

      const statusBody: AuthStatusResponse = {
        status: overallState.status,
        ...(overallState.error ? { error: overallState.error?.message } : {}),
        correlationId,
        definitionId,
        lastUpdated: overallState.lastUpdated,
        ...(responseState && responseState.status === 'verified' ? { payload: await responseState.response.mergedPayloads() } : {}),
      }
      console.log(`Will send auth status: ${JSON.stringify(statusBody)}`)
      if (overallState.status === AuthorizationRequestStateStatus.ERROR || overallState.status === AuthorizationResponseStateStatus.ERROR) {
        response.statusCode = 500
        return response.send(statusBody)
      }
      response.statusCode = 200
      return response.send(statusBody)
    })
  }

  private createAuthRequestWebappEndpoint() {
    this.express.post('/webapp/definitions/:definitionId/auth-requests', (request: RequestWithAgent, response) => {
      // if (!request.agent) throw Error('No agent configured')
      const definitionId = request.params.definitionId
      const state: string = uuid.uuid()
      const correlationId = state
      const requestByReferenceURI = uriWithBase(`/siop/definitions/${definitionId}/auth-requests/${correlationId}`)
      const redirectURI = uriWithBase(`/siop/definitions/${definitionId}/auth-responses/${correlationId}`)


      this.agent.siopCreateAuthRequestURI({
        definitionId,
        correlationId,
        state,
        requestByReferenceURI,
        redirectURI,
      }).then(
        authRequestURI => {
          const authRequestBody: GenerateAuthRequestURIResponse = {
            correlationId,
            definitionId,
            authRequestURI,
            authStatusURI: `${uriWithBase('/webapp/auth-status')}`,
          }
          console.log(`Auth Request URI data: ${authRequestBody}`)
          return response.send(authRequestBody)
        },
      ).catch((e: Error) => {
        console.error(e, e.stack)
        return SIOPv2RPRestAPI.sendErrorResponse(response, 500, 'Could not create an authorization request URI: ' + e.message)
      })
    })
  }



  private verifyAuthResponseSIOPv2Endpoint() {
    this.express.post('/siop/definitions/:definitionId/auth-responses/:correlationId', async (request, response) => {
      const correlationId = request.params.correlationId
      const definitionId = request.params.definitionId
      if (!correlationId || !definitionId) {
        console.log(`No authorization request could be found for the given url. correlationId: ${correlationId}, definitionId: ${definitionId}`)
        return SIOPv2RPRestAPI.sendErrorResponse(response, 404, 'No authorization request could be found')
      }
      console.log('Authorization Response (siop-sessions')
      console.log(JSON.stringify(request.body, null, 2))
      const responseURI = request.body
      const definition = await this.agent.pexDefinitionGet(definitionId)
      if (!definition) {
        response.statusCode = 404
        response.statusMessage = `No definition ${definitionId}`
        return response.send()
      }
      this.agent.siopVerifyAuthResponse({
        authorizationResponse: responseURI,
        correlationId,
        definitionId,
        presentationDefinitions: [
          {
            location: PresentationDefinitionLocation.CLAIMS_VP_TOKEN,
            definition,
          },
        ],
      })
        .then((verifiedResponse: VerifiedAuthorizationResponse) => {
          console.log('verifiedResponse: ', JSON.stringify(verifiedResponse, null, 2))

          const wrappedPresentation = verifiedResponse?.oid4vpSubmission?.presentations[0]
          if (wrappedPresentation) {
            const credentialSubject = wrappedPresentation.presentation.verifiableCredential[0].credential.credentialSubject
            console.log('AND WE ARE DONE!')
            console.log(JSON.stringify(credentialSubject, null, 2))
            console.log(JSON.stringify(wrappedPresentation.presentation, null, 2))
            response.statusCode = 200
            // todo: delete session
          } else {
            response.statusCode = 500
            response.statusMessage = 'Missing Credentials'
          }
          return response.send()
        })
        .catch((reason) => {
          console.error('verifyAuthenticationResponseJwt failed:', reason)
        })
      response.statusCode = 500
      response.statusMessage = 'Missing Credentials'
      return response.send()
    })
  }

  private getAuthRequestSIOPv2Endpoint() {
    this.express.get('/siop/definitions/:definitionId/auth-requests/:correlationId', async (request, response) => {
      const correlationId = request.params.correlationId
      const definitionId = request.params.definitionId
      if (!correlationId || !definitionId) {
        console.log(`No authorization request could be found for the given url. correlationId: ${correlationId}, definitionId: ${definitionId}`)
        return SIOPv2RPRestAPI.sendErrorResponse(response, 404, 'No authorization request could be found')
      }
      const requestState = await this.agent.siopGetAuthRequestState({
        correlationId,
        definitionId,
        errorOnNotFound: false,
      })
      if (!requestState) {
        console.log(`No authorization request could be found for the given url in the state manager. correlationId: ${correlationId}, definitionId: ${definitionId}`)
        return SIOPv2RPRestAPI.sendErrorResponse(response, 404, `No authorization request could be found`)
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
      } finally {
        this.agent.siopUpdateAuthRequestState({
          correlationId,
          definitionId,
          state: AuthorizationRequestStateStatus.SENT,
          error,
        })
      }
    })
  }
}
