import { fetch } from 'cross-fetch'
import {
  IOID4VCIRestClient,
  IOID4VCIClientCreateOfferUriRequest,
  IOID4VCIClientCreateOfferUriRequestArgs,
  IOID4VCIClientCreateOfferUriResponse,
} from '../types/IOID4VCIRestClient'
import Debug from 'debug'
import { IAgentPlugin } from '@veramo/core'

const debug = Debug('sphereon:ssi-sdk:oid4vci:issuer:rest-client')

/**
 * {@inheritDoc IOID4VCIRestClient}
 */
export class OID4VCIRestClient implements IAgentPlugin {
  readonly methods: IOID4VCIRestClient = {
    oid4vciClientCreateOfferUri: this.oid4vciClientCreateOfferUri.bind(this),
  }

  private readonly agentBaseUrl?: string

  constructor(args?: { baseUrl?: string }) {
    if (args?.baseUrl) {
      this.agentBaseUrl = args.baseUrl
    }
  }

  /** {@inheritDoc IOID4VCIRestClient.vciClientCreateOfferUri} */
  private async oid4vciClientCreateOfferUri(args: IOID4VCIClientCreateOfferUriRequestArgs): Promise<IOID4VCIClientCreateOfferUriResponse> {
    if (!args.credentials || !args.grants) {
      return Promise.reject(Error("Can't generate the credential offer url without credentials and grants params present."))
    }
    const baseUrl = args.baseUrl || this.agentBaseUrl
    if (!baseUrl) {
      return Promise.reject(Error('No base url has been provided'))
    }
    const request: IOID4VCIClientCreateOfferUriRequest = {
      credentials: args.credentials,
      grants: args.grants,
    }
    const url = OID4VCIRestClient.urlWithBase(`webapp/credential-offers`, baseUrl)
    debug(`OID4VCIRestClient is going to send request: ${JSON.stringify(request)} to ${url}`)
    try {
      const origResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

  private static urlWithBase(path: string, baseUrl: string): string {
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  }
}
