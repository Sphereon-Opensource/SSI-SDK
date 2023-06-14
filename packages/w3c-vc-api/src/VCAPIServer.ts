// noinspection JSUnusedGlobalSymbols

import { CredentialPayload, TAgent, VerifiableCredential } from '@veramo/core'
import { ProofFormat } from '@veramo/core/src/types/ICredentialIssuer'
import { W3CVerifiableCredential } from '@veramo/core/src/types/vc-data-model'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import * as dotenv from 'dotenv-flow'
import express, { Express, Request, Response } from 'express'
import { v4 } from 'uuid'
import { IRequiredPlugins } from './types'

export interface IVCAPIOpts {
  issueCredentialOpts?: IIssueOpts
  serverOpts?: IServerOpts
}

export interface IServerOpts {
  port?: number // The port to listen on
  cookieSigningKey?: string
  hostname?: string // defaults to "0.0.0.0", meaning it will listen on all IP addresses. Can be an IP address or hostname
}

export interface IIssueOpts {
  issueCredentialPath?: string
  getCredentialsPath?: string
  getCredentialPath?: string
  deleteCredentialPath?: string
  verifyCredentialPath?: string
  verifyPresentationPath?: string

  persistIssuedCredentials?: boolean // Whether the issuer persists issued credentials or not. Defaults to true

  /**
   * The desired format for the VerifiablePresentation to be created.
   */
  proofFormat: ProofFormat

  /**
   * Remove payload members during JWT-JSON transformation. Defaults to `true`.
   * See https://www.w3.org/TR/vc-data-model/#jwt-encoding
   */
  removeOriginalFields?: boolean

  /**
   * [Optional] The ID of the key that should sign this credential.
   * If this is not specified, the first matching key will be used.
   */
  keyRef?: string

  /**
   * When dealing with JSON-LD you also MUST provide the proper contexts.
   * Set this to `true` ONLY if you want the `@context` URLs to be fetched in case they are not preloaded.
   * The context definitions SHOULD rather be provided at startup instead of being fetched.
   *
   * Defaults to `false`
   */
  fetchRemoteContexts?: boolean
}

export interface IIssueOptionsPayload {
  created?: string
  challenge?: string
  domain?: string
  credentialStatus?: {
    type: string
  }
}

export interface ChallengeOptsPayload {
  challenge?: string
  domain?: string
}

export class VCAPIServer {
  private readonly _express: Express
  private readonly _agent: TAgent<IRequiredPlugins>
  private readonly _opts?: IVCAPIOpts

  constructor(args: { agent: TAgent<IRequiredPlugins>; express?: Express; opts?: IVCAPIOpts }) {
    const { agent, opts } = args
    this._agent = agent
    this._opts = opts
    const existingExpress = !!args.express
    this._express = args.express ?? express()
    this.setupExpress(existingExpress)

    // Credential endpoints
    this.issueCredentialEndpoint()
    this.getCredentialEndpoint()
    this.getCredentialsEndpoint()
    this.deleteCredentialEndpoint() // not in spec. TODO: Authz
    this.verifyCredentialEndpoint()
  }

  get agent(): TAgent<IRequiredPlugins> {
    return this._agent
  }

  get opts(): IVCAPIOpts | undefined {
    return this._opts
  }

  get express(): Express {
    return this._express
  }

  private setupExpress(existingExpress: boolean) {
    dotenv.config()
    if (!existingExpress) {
      const port = this.opts?.serverOpts?.port || process.env.PORT || 5000
      const secret = this.opts?.serverOpts?.cookieSigningKey || process.env.COOKIE_SIGNING_KEY
      const hostname = this.opts?.serverOpts?.hostname || '0.0.0.0'
      this._express.use((req, res, next) => {
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
      this._express.use(bodyParser.urlencoded({ extended: true }))
      this._express.use(bodyParser.json())
      this._express.use(cookieParser(secret))
      this._express.listen(port as number, hostname, () => console.log(`Listening on ${hostname}, port ${port}`))
    }
  }

  private static sendErrorResponse(response: Response, statusCode: number, message: string) {
    console.log(message)
    response.statusCode = statusCode
    response.status(statusCode).send(message)
  }

  private getCredentialsEndpoint() {
    this._express.get(this.opts?.issueCredentialOpts?.getCredentialsPath ?? '/credentials', async (request: Request, response: Response) => {
      try {
        const uniqueVCs = await this.agent.dataStoreORMGetVerifiableCredentials()
        response.statusCode = 202
        return response.send(uniqueVCs.map((uVC) => uVC.verifiableCredential))
      } catch (e) {
        console.log(e)
        return VCAPIServer.sendErrorResponse(response, 500, e.message as string)
      }
    })
  }

  private getCredentialEndpoint() {
    this._express.get(this.opts?.issueCredentialOpts?.getCredentialPath ?? '/credentials/:id', async (request: Request, response: Response) => {
      try {
        const id = request.params.id
        if (!id) {
          return VCAPIServer.sendErrorResponse(response, 400, 'no id provided')
        }
        let vcInfo = await this.getCredentialByIdOrHash(id)
        if (!vcInfo.vc) {
          return VCAPIServer.sendErrorResponse(response, 404, `id ${id} not found`)
        }
        response.statusCode = 200
        return response.send(vcInfo.vc)
      } catch (e) {
        console.log(e)
        return VCAPIServer.sendErrorResponse(response, 500, e.message as string)
      }
    })
  }

  private verifyCredentialEndpoint() {
    this._express.post(
      this.opts?.issueCredentialOpts?.verifyCredentialPath ?? '/credentials/verify',
      async (request: Request, response: Response) => {
        try {
          console.log(request.body)
          const credential: W3CVerifiableCredential = request.body.verifiableCredential
          // const options: IIssueOptionsPayload = request.body.options
          if (!credential) {
            return VCAPIServer.sendErrorResponse(response, 400, 'No verifiable credential supplied')
          }
          const verifyResult = await this.agent.verifyCredential({
            credential,
            fetchRemoteContexts: this.opts?.issueCredentialOpts?.fetchRemoteContexts,
          })

          response.statusCode = 200
          return response.send(verifyResult)
        } catch (e) {
          console.log(e)
          return VCAPIServer.sendErrorResponse(response, 500, e.message as string)
        }
      }
    )
  }

  private deleteCredentialEndpoint() {
    this._express.delete(this.opts?.issueCredentialOpts?.getCredentialsPath ?? '/credentials/:id', async (request: Request, response: Response) => {
      try {
        const id = request.params.id
        if (!id) {
          return VCAPIServer.sendErrorResponse(response, 400, 'no id provided')
        }
        let vcInfo = await this.getCredentialByIdOrHash(id)
        if (!vcInfo.vc || !vcInfo.hash) {
          return VCAPIServer.sendErrorResponse(response, 404, `id ${id} not found`)
        }
        const success = this.agent.dataStoreDeleteVerifiableCredential({ hash: vcInfo.hash })
        if (!success) {
          return VCAPIServer.sendErrorResponse(response, 400, `Could not delete Verifiable Credential with id ${id}`)
        }
        response.statusCode = 200
        return response.send()
      } catch (e) {
        console.log(e)
        return VCAPIServer.sendErrorResponse(response, 500, e.message as string)
      }
    })
  }

  private issueCredentialEndpoint() {
    this._express.post(this.opts?.issueCredentialOpts?.issueCredentialPath ?? '/credentials/issue', async (request: Request, response: Response) => {
      try {
        const credential: CredentialPayload = request.body.credential
        // const options: IIssueOptionsPayload = request.body.options
        if (!credential) {
          return VCAPIServer.sendErrorResponse(response, 400, 'No credential supplied')
        }
        if (!credential.id) {
          credential.id = `urn:uuid:${v4()}`
        }
        const issueOpts = this.opts?.issueCredentialOpts
        const vc = await this._agent.createVerifiableCredential({
          credential,
          save: issueOpts?.persistIssuedCredentials ?? true,
          proofFormat: issueOpts?.proofFormat ?? 'lds',
          fetchRemoteContexts: issueOpts?.fetchRemoteContexts || true,
        })
        response.statusCode = 201
        return response.send({ verifiableCredential: vc })
      } catch (e) {
        console.log(e)
        return VCAPIServer.sendErrorResponse(response, 500, e.message as string)
      }
    })
  }

  private async getCredentialByIdOrHash(idOrHash: string): Promise<{
    id: string
    hash?: string
    vc?: VerifiableCredential
  }> {
    let vc: VerifiableCredential
    let hash: string
    const uniqueVCs = await this.agent.dataStoreORMGetVerifiableCredentials({
      where: [
        {
          column: 'id',
          value: [idOrHash],
          op: 'Equal',
        },
      ],
    })
    if (uniqueVCs.length === 0) {
      hash = idOrHash
      vc = await this.agent.dataStoreGetVerifiableCredential({ hash })
    } else {
      const uniqueVC = uniqueVCs[0]
      hash = uniqueVC.hash
      vc = uniqueVC.verifiableCredential
    }

    return {
      vc,
      id: idOrHash,
      hash,
    }
  }
}
