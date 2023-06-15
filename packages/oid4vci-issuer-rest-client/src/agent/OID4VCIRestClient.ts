import { fetch } from 'cross-fetch'
import {
  IOID4VCIRestClient,
  IVCIClientCreateOfferUriRequest,
  IVCIClientCreateOfferUriRequestArgs,
  IVCIClientCreateOfferUriResponse,
} from '../types/IOID4VCIRestClient'
import Debug from 'debug'
import { IAgentPlugin } from '@veramo/core'

const debug = Debug('sphereon:ssi-sdk.oid4vci-issuer-rest-client')

/**
 * @beta
 */
export class OID4VCIRestClient implements IAgentPlugin {
  readonly methods: IOID4VCIRestClient = {
    vciClientCreateOfferUri: this.vciClientCreateOfferUri.bind(this),
  }

  private readonly baseUrl?: string

  constructor(args?: { baseUrl?: string }) {
    if (args?.baseUrl) {
      this.baseUrl = args.baseUrl
    }
  }

  private async vciClientCreateOfferUri(args: IVCIClientCreateOfferUriRequestArgs): Promise<IVCIClientCreateOfferUriResponse> {
    if (!args.credentials || !args.grants) {
      throw new Error("Can't generate the credential offer url without credentials and grants params present.")
    }
    const baseUrl = args.baseUrl || this.baseUrl
    if (!baseUrl) {
      throw new Error('No base url has been provided')
    }
    const request: IVCIClientCreateOfferUriRequest = {
      credentials: args.credentials,
      grants: args.grants,
    }
    const url = this.urlWithBase(`webapp/credential-offers`, baseUrl)
    debug(`OID4VCIRestClient is going to send request: ${JSON.stringify(request)} to ${url}`)
    try {
      const origResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })
      if (origResponse.status >= 400) {
        return Promise.reject(Error(`request to ${url} returned ${origResponse.status}`));
      }
      return await origResponse.json()
    } catch (e) {
      debug(`Error on posting to url ${url}: ${e}`)
      throw e
    }
  }

  private urlWithBase(path: string, baseUrl?: string): string {
    if (!this.baseUrl && !baseUrl) {
      throw new Error('You have to provide baseUrl')
    }
    return baseUrl ? `${baseUrl}${path.startsWith('/') ? path : `/${path}`}` : `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  }
}
