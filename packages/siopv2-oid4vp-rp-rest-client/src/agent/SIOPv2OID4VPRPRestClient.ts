import { fetch } from 'cross-fetch'
import {
  ISiopClientGenerateAuthRequestArgs,
  ISiopClientGetAuthStatusArgs,
  ISiopClientRemoveAuthRequestSessionArgs,
  ISIOPv2OID4VPRPRestClient,
  Siopv2RestClientAuthenticationOpts,
  Siopv2RestClientOpts,
} from '../types/ISIOPv2OID4VPRPRestClient'
import Debug from 'debug'
import { IAgentPlugin } from '@veramo/core'
import { AuthStatusResponse, GenerateAuthRequestURIResponse } from '@sphereon/ssi-sdk.siopv2-oid4vp-common'

const debug = Debug('sphereon:ssi-sdk-siopv2-oid4vp-rp-rest-client')

/**
 * @beta
 */
export class SIOPv2OID4VPRPRestClient implements IAgentPlugin {
  readonly methods: ISIOPv2OID4VPRPRestClient = {
    siopClientRemoveAuthRequestState: this.siopClientRemoveAuthRequestState.bind(this),
    siopClientCreateAuthRequest: this.siopClientCreateAuthRequest.bind(this),
    siopClientGetAuthStatus: this.siopClientGetAuthStatus.bind(this),
  }

  private readonly baseUrl?: string
  private readonly definitionId?: string
  private readonly authOpts?: Siopv2RestClientAuthenticationOpts

  constructor(args?: Siopv2RestClientOpts) {
    this.baseUrl = args?.baseUrl
    this.definitionId = args?.definitionId
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

  private async siopClientRemoveAuthRequestState(args: ISiopClientRemoveAuthRequestSessionArgs): Promise<boolean> {
    const baseUrl = this.checkBaseUrlParameter(args.baseUrl)
    const definitionId = this.checkDefinitionIdParameter(args.definitionId)
    await fetch(this.uriWithBase(`/webapp/definitions/${definitionId}/auth-requests/${args.correlationId}`, baseUrl), {
      headers: await this.createHeaders(),
      method: 'DELETE',
    })
    return true
  }

  private async siopClientGetAuthStatus(args: ISiopClientGetAuthStatusArgs): Promise<AuthStatusResponse> {
    const baseUrl = this.checkBaseUrlParameter(args.baseUrl)
    const url = this.uriWithBase('/webapp/auth-status', baseUrl)
    const definitionId = this.checkDefinitionIdParameter(args.definitionId)
    const statusResponse = await fetch(url, {
      method: 'POST',
      headers: await this.createHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        correlationId: args.correlationId,
        definitionId,
      }),
    })
    debug(`auth status response: ${statusResponse}`)
    try {
      return await statusResponse.json()
    } catch (err) {
      throw Error(`Status has returned ${statusResponse.status}`)
    }
  }

  private async siopClientCreateAuthRequest(args: ISiopClientGenerateAuthRequestArgs): Promise<GenerateAuthRequestURIResponse> {
    const baseUrl = this.checkBaseUrlParameter(args.baseUrl)
    const definitionId = this.checkDefinitionIdParameter(args.definitionId)
    const url = this.uriWithBase(`/webapp/definitions/${definitionId}/auth-requests`, baseUrl)
    const origResponse = await fetch(url, {
      method: 'POST',
      headers: await this.createHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({}),
    })
    return await origResponse.json()
  }

  private uriWithBase(path: string, baseUrl?: string): string {
    if (!this.baseUrl && !baseUrl) {
      throw new Error('You have to provide baseUrl')
    }
    return baseUrl ? `${baseUrl}${path.startsWith('/') ? path : '/' + path}` : `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`
  }

  private checkBaseUrlParameter(baseUrl?: string): string {
    if (!baseUrl && !this.baseUrl) {
      throw new Error('No base url has been provided')
    }
    return baseUrl ? baseUrl : (this.baseUrl as string)
  }

  private checkDefinitionIdParameter(definitionId?: string): string {
    if (!definitionId && !this.definitionId) {
      throw new Error('No definition id has been provided')
    }
    return definitionId ? definitionId : (this.definitionId as string)
  }
}
