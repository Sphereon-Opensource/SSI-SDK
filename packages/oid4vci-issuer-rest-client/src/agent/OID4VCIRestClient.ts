import { fetch } from 'cross-fetch'
import {
  IOID4VCIRestClient,
  IOID4VCIClientCreateOfferUriRequest,
  IOID4VCIClientCreateOfferUriRequestArgs,
  IOID4VCIClientCreateOfferUriResponse,
  IOID4VCIClientGetIssueStatusArgs,
  IRestClientAuthenticationOpts,
} from '../types/IOID4VCIRestClient'
import { IssueStatusResponse } from '@sphereon/oid4vci-common'
import Debug from 'debug'
import { IAgentPlugin } from '@veramo/core'

const debug = Debug('sphereon:ssi-sdk:oid4vci:issuer:rest-client')

/**
 * {@inheritDoc IOID4VCIRestClient}
 */
export class OID4VCIRestClient implements IAgentPlugin {
  readonly methods: IOID4VCIRestClient = {
    oid4vciClientCreateOfferUri: this.oid4vciClientCreateOfferUri.bind(this),
    oid4vciClientGetIssueStatus: this.oid4vciClientGetIssueStatus.bind(this),
  }

  private readonly agentBaseUrl?: string
  private readonly authOpts?: IRestClientAuthenticationOpts

  constructor(args?: { baseUrl?: string; authentication?: IRestClientAuthenticationOpts }) {
    if (args?.baseUrl) {
      this.agentBaseUrl = args.baseUrl
    }
    this.authOpts = args?.authentication
  }
  private async createHeaders(existing?: Record<string, any>): Promise<HeadersInit> {
    const headers: HeadersInit = {
      ...existing,
      Accept: 'application/json',
    }
    if (this.authOpts?.enabled === true) {
      if (!this.authOpts.bearerToken) {
        throw Error(`Cannot have authentication enabled, whilst not enabling static bearer tokens at this point`)
      }
      headers.Authorization = `Bearer ${
        typeof this.authOpts.bearerToken === 'string' ? this.authOpts.bearerToken : await this.authOpts.bearerToken()
      }`
    }
    return headers
  }

  /** {@inheritDoc IOID4VCIRestClient.vciClientCreateOfferUri} */
  private async oid4vciClientCreateOfferUri(args: IOID4VCIClientCreateOfferUriRequestArgs): Promise<IOID4VCIClientCreateOfferUriResponse> {
    if (!args.credential_configuration_ids || !args.grants) {
      return Promise.reject(Error("Can't generate the credential offer url without credentials and grants params present."))
    }
    const baseUrl = this.assertedAgentBaseUrl(args.agentBaseUrl)
    const request: IOID4VCIClientCreateOfferUriRequest = {
      credential_configuration_ids: args.credential_configuration_ids,
      grants: args.grants,
      ...(args.credentialDataSupplierInput && { credentialDataSupplierInput: args.credentialDataSupplierInput }),
    }
    const url = OID4VCIRestClient.urlWithBase(`webapp/credential-offers`, baseUrl)
    debug(`OID4VCIRestClient is going to send request: ${JSON.stringify(request)} to ${url}`)
    try {
      const origResponse = await fetch(url, {
        method: 'POST',
        headers: await this.createHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(request),
      })
      if (!origResponse.ok) {
        return Promise.reject(Error(`request to ${url} returned ${origResponse.status}`))
      }
      return await origResponse.json()
    } catch (e) {
      debug(`Error on posting to url ${url}: ${e}`)
      return Promise.reject(Error(`request to ${url} returned ${e}`))
    }
  }

  private async oid4vciClientGetIssueStatus(args: IOID4VCIClientGetIssueStatusArgs): Promise<IssueStatusResponse> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = OID4VCIRestClient.urlWithBase('/webapp/credential-offer-status', baseUrl)
    const statusResponse = await fetch(url, {
      method: 'POST',
      headers: await this.createHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        id: args.id,
      }),
    })
    debug(`issue status response: ${statusResponse}`)
    try {
      return await statusResponse.json()
    } catch (err) {
      throw Error(`Status has returned ${statusResponse.status}`)
    }
  }

  private assertedAgentBaseUrl(baseUrl?: string): string {
    if (baseUrl) {
      return baseUrl
    } else if (this.agentBaseUrl) {
      return this.agentBaseUrl
    }
    throw new Error('No base url has been provided')
  }

  private static urlWithBase(path: string, baseUrl: string): string {
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  }
}
