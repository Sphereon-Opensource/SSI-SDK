// noinspection JSUnusedGlobalSymbols

import * as dotenv from 'dotenv-flow'
import express, { Express, Response } from 'express'
import cookieParser from 'cookie-parser'
import uuid from 'short-uuid'
import {
  AuthorizationRequestState,
  AuthorizationResponsePayload,
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
} from '@sphereon/ssi-sdk.siopv2-oid4vp-common'
import { ISIOPv2RP, VerifiedDataMode } from '@sphereon/ssi-sdk.siopv2-oid4vp-rp-auth'
import { RequestWithAgent } from './request-agent-router'
import { TAgent } from '@veramo/core'
import { IPresentationExchange } from '@sphereon/ssi-sdk.presentation-exchange'

export interface ISIOPv2RPRestAPIOpts {
  siopBaseURI?: string // An externally communicated base URI for SIOP endpoints. Needs to be provided via this option, or environment variable!
  webappBaseURI?: string // An externally communicated base URI for webapp endpoints. Needs to be provided via this option, or environment variable!
  webappCreateAuthRequestPath?: string // Override the create Auth Request path. Needs to contain correlationId and definitionId path params!
  webappDeleteAuthRequestPath?: string // Override the delete Auth Request path. Needs to contain correlationId and definitionId path params!
  webappAuthStatusPath?: string // Override the Auth status path. CorrelationId and definitionId need to come from the body!
  siopVerifyAuthResponsePath?: string // Override the siop Verify Response path. Needs to contain correlationId and definitionId path params!
  siopGetAuthRequestPath?: string // Override the siop get Auth Request path. Needs to contain correlationId and definitionId path params!
  port?: number // The port to listen on
  cookieSigningKey?: string
  hostname?: string // defaults to "0.0.0.0", meaning it will listen on all IP addresses. Can be an IP address or hostname
}

export class SIOPv2RPRestAPI {
  private express: Express
  private agent: TAgent<IPresentationExchange & ISIOPv2RP>
  private _opts?: ISIOPv2RPRestAPIOpts

  constructor(args: { agent: TAgent<IPresentationExchange & ISIOPv2RP>; express?: Express; opts?: ISIOPv2RPRestAPIOpts }) {
    const { agent, opts } = args
    this.agent = agent
    this._opts = opts
    const existingExpress = !!args.express
    this.express = existingExpress ? args.express! : express()
    this.setupExpress(existingExpress)

    // Webapp endpoints
    this.createAuthRequestWebappEndpoint()
    this.authStatusWebappEndpoint()
    this.removeAuthRequestStateWebappEndpoint()

    // SIOPv2 endpoints
    this.getAuthRequestSIOPv2Endpoint()
    this.verifyAuthResponseSIOPv2Endpoint()
  }

  private setupExpress(existingExpress: boolean) {
    dotenv.config()
    if (!existingExpress) {
      const port = this._opts?.port || process.env.PORT || 5000
      const secret = this._opts?.cookieSigningKey || process.env.COOKIE_SIGNING_KEY
      const hostname = this._opts?.hostname || '0.0.0.0'
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
      this.express.listen(port as number, hostname, () => console.log(`Listening on ${hostname}, port ${port}`))
    }
  }

  private static sendErrorResponse(response: Response, statusCode: number, message: string) {
    response.statusCode = statusCode
    response.status(statusCode).send(JSON.stringify(message))
  }

  private removeAuthRequestStateWebappEndpoint() {
    this.express.delete(
      this._opts?.webappDeleteAuthRequestPath ?? '/webapp/definitions/:definitionId/auth-requests/:correlationId',
      async (request, response) => {
        const correlationId: string = request.params.correlationId
        const definitionId: string = request.params.definitionId
        if (!correlationId || !definitionId) {
          console.log(`No authorization request could be found for the given url. correlationId: ${correlationId}, definitionId: ${definitionId}`)
          return SIOPv2RPRestAPI.sendErrorResponse(response, 404, 'No authorization request could be found')
        }
        response.statusCode = 200
        return response.send(this.agent.siopDeleteAuthState({ definitionId, correlationId }))
      }
    )
  }

  private authStatusWebappEndpoint() {
    this.express.post(this._opts?.webappAuthStatusPath ?? '/webapp/auth-status', async (request: RequestWithAgent, response) => {
      console.log('Received auth-status request...')
      const correlationId: string = request.body.correlationId as string
      const definitionId: string = request.body.definitionId as string

      const requestState =
        correlationId && definitionId
          ? await this.agent.siopGetAuthRequestState({
              correlationId,
              definitionId,
              errorOnNotFound: false,
            })
          : undefined
      if (!requestState || !definitionId || !correlationId) {
        console.log(
          `No authentication request mapping could be found for the given URL. correlation: ${correlationId}, definitionId: ${definitionId}`
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

      let includeVerifiedData: VerifiedDataMode = VerifiedDataMode.NONE
      if ('includeVerifiedData' in request.body) {
        includeVerifiedData = request.body.includeVerifiedData as VerifiedDataMode
      }

      let responseState
      if (requestState.status === AuthorizationRequestStateStatus.SENT) {
        responseState = await this.agent.siopGetAuthResponseState({
          correlationId,
          definitionId,
          includeVerifiedData: includeVerifiedData,
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
        ...(responseState && responseState.status === AuthorizationResponseStateStatus.VERIFIED
          ? { payload: await responseState.response.mergedPayloads() }
          : {}),
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
    this.express.post(
      this._opts?.webappCreateAuthRequestPath || '/webapp/definitions/:definitionId/auth-requests',
      (request: RequestWithAgent, response) => {
        try {
          // if (!request.agent) throw Error('No agent configured')
          const definitionId = request.params.definitionId
          const state: string = uuid.uuid()
          const correlationId = state

          const requestByReferenceURI = uriWithBase(`/siop/definitions/${definitionId}/auth-requests/${correlationId}`, {
            baseURI: this._opts?.siopBaseURI,
          })
          const redirectURI = uriWithBase(`/siop/definitions/${definitionId}/auth-responses/${correlationId}`, { baseURI: this._opts?.siopBaseURI })

          this.agent
            .siopCreateAuthRequestURI({
              definitionId,
              correlationId,
              state,
              requestByReferenceURI,
              redirectURI,
            })
            .then((authRequestURI) => {
              const authRequestBody: GenerateAuthRequestURIResponse = {
                correlationId,
                definitionId,
                authRequestURI,
                authStatusURI: `${uriWithBase(this._opts?.webappAuthStatusPath ?? '/webapp/auth-status', { baseURI: this._opts?.webappBaseURI })}`,
              }
              console.log(`Auth Request URI data to send back: ${JSON.stringify(authRequestBody)}`)
              return response.send(authRequestBody)
            })
            .catch((e: Error) => {
              console.error(e, e.stack)
              return SIOPv2RPRestAPI.sendErrorResponse(response, 500, 'Could not create an authorization request URI: ' + e.message)
            })
        } catch (error) {
          console.error(error)
          return SIOPv2RPRestAPI.sendErrorResponse(response, 500, 'Could not create an authorization request URI')
        }
      }
    )
  }

  private verifyAuthResponseSIOPv2Endpoint() {
    this.express.post(
      this._opts?.siopVerifyAuthResponsePath ?? '/siop/definitions/:definitionId/auth-responses/:correlationId',
      async (request, response) => {
        try {
          const correlationId = request.params.correlationId
          const definitionId = request.params.definitionId
          if (!correlationId || !definitionId) {
            console.log(`No authorization request could be found for the given url. correlationId: ${correlationId}, definitionId: ${definitionId}`)
            return SIOPv2RPRestAPI.sendErrorResponse(response, 404, 'No authorization request could be found')
          }
          console.log('Authorization Response (siop-sessions')
          console.log(JSON.stringify(request.body, null, 2))
          const definition = await this.agent.pexStoreGetDefinition({ definitionId })
          const authorizationResponse = typeof request.body === 'string' ? request.body : (request.body as AuthorizationResponsePayload)
          console.log(`URI: ${JSON.stringify(authorizationResponse)}`)
          if (!definition) {
            response.statusCode = 404
            response.statusMessage = `No definition ${definitionId}`
            return response.send()
          }
          await this.agent
            .siopVerifyAuthResponse({
              authorizationResponse,
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
              // console.log('verifiedResponse: ', JSON.stringify(verifiedResponse, null, 2))

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
            .catch((reason: Error) => {
              console.error('verifyAuthenticationResponseJwt failed:', reason)
              response.statusCode = 500
              response.statusMessage = reason.message
              return response.send()
            })
        } catch (error) {
          console.error(error)
          return SIOPv2RPRestAPI.sendErrorResponse(response, 500, 'Could not verify auth status')
        }
      }
    )
  }

  private getAuthRequestSIOPv2Endpoint() {
    this.express.get(
      this._opts?.siopGetAuthRequestPath ?? '/siop/definitions/:definitionId/auth-requests/:correlationId',
      async (request, response) => {
        try {
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
            console.log(
              `No authorization request could be found for the given url in the state manager. correlationId: ${correlationId}, definitionId: ${definitionId}`
            )
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
        } catch (error) {
          console.error(error)
          return SIOPv2RPRestAPI.sendErrorResponse(response, 500, 'Could not get authorization request')
        }
      }
    )
  }
}
