import { fetch } from 'cross-fetch'
import {
  ISIOPv2OID4VPRPRestClient,
  ISiopClientGenerateAuthRequestArgs,
  ISiopClientGetAuthStatusArgs,
  IRequiredContext,
  ISiopClientRemoveAuthRequestSessionArgs,
} from '../index'
import Debug from 'debug'
import { IAgentPlugin } from '@veramo/core'
import { AuthStatusResponse, GenerateAuthRequestURIResponse } from '@sphereon/ssi-sdk-siopv2-oid4vp-common'

const debug = Debug('ssi-sdk-siopv2-oid4vp-rp-rest-client:SiopV2OID4VpRpRestClient')

export class SIOPv2OID4VPRPRestClient implements IAgentPlugin {
  readonly methods: ISIOPv2OID4VPRPRestClient = {
    siopClientRemoveAuthRequestSession: this.siopClientRemoveAuthRequestSession.bind(this),
    siopClientGenerateAuthRequest: this.siopClientGenerateAuthRequest.bind(this),
    siopClientGetAuthStatus: this.siopClientGetAuthStatus.bind(this),
  }

  private readonly baseUrl?: string
  private readonly definitionId?: string

  constructor(args?: { baseUrl?: string, definitionId?: string }) {
    if (args?.baseUrl) {
      this.baseUrl = args.baseUrl
    }
    if (args?.definitionId) {
      this.definitionId = args.definitionId
    }
  }

  private async siopClientRemoveAuthRequestSession(args: ISiopClientRemoveAuthRequestSessionArgs, context: IRequiredContext): Promise<void> {
    const baseUrl = this.checkBaseUrlParameter(args.baseUrl)
    const definitionId = this.checkDefinitionIdParameter(args.definitionId)
    await fetch(this.uriWithBase(`/webapp/definitions/${definitionId}/auth-requests/${args.correlationId}`, baseUrl), {
      method: 'DELETE',
    })
  }

  private async siopClientGetAuthStatus(args: ISiopClientGetAuthStatusArgs, context: IRequiredContext): Promise<AuthStatusResponse> {
    const baseUrl = this.checkBaseUrlParameter(args.baseUrl)
    const url = this.uriWithBase('/webapp/auth-status', baseUrl)
    const definitionId = this.checkDefinitionIdParameter(args.definitionId)
    const statusResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

  private async siopClientGenerateAuthRequest(
    args: ISiopClientGenerateAuthRequestArgs,
    context: IRequiredContext
  ): Promise<GenerateAuthRequestURIResponse> {
    const baseUrl = this.checkBaseUrlParameter(args.baseUrl)
    const definitionId = this.checkDefinitionIdParameter(args.definitionId)
    const url = this.uriWithBase(`/webapp/definitions/${definitionId}/auth-request-uri`, baseUrl)
    const origResponse = await fetch(url)
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
