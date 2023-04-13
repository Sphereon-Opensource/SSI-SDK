import { fetch } from 'cross-fetch'
import {
  ISiopV2OID4VpRpRestClient,
  IGenerateAuthRequestArgs,
  IGenerateAuthRequestURIResponse,
  IPollAuthStatusArgs,
  IRequiredContext,
  IDeleteDefinitionCorrelationArgs,
} from '../index'
import Debug from 'debug'
import { IAgentPlugin } from '@veramo/core'

const debug = Debug('ssi-sdk-siopv2-oid4vp-rp-rest-client:SiopV2OID4VpRpRestClient')
export class SiopV2OID4VpRpRestClient implements IAgentPlugin {
  readonly methods: ISiopV2OID4VpRpRestClient = {
    deleteDefinitionCorrelation: this.deleteDefinitionCorrelation.bind(this),
    generateAuthRequest: this.generateAuthRequest.bind(this),
    pollAuthStatus: this.pollAuthStatus.bind(this),
  }

  private readonly baseUrl?: string
  private readonly definitionId?: string

  constructor(baseUrl?: string, definitionId?: string) {
    if (baseUrl) {
      this.baseUrl = baseUrl
    }
    if (definitionId) {
      this.definitionId = definitionId
    }
  }

  private async deleteDefinitionCorrelation(args: IDeleteDefinitionCorrelationArgs, context: IRequiredContext) {
    if (args.definitionId && this.definitionId) {
      throw new Error('No definition id has been provided')
    }
    const definitionId = args.definitionId ? args.definitionId : this.definitionId
    return await fetch(this.uriWithBase(`/webapp/definitions/${definitionId}/auth-requests/${args.correlationId}`, args.baseUrl), {
      method: 'DELETE',
    })
  }

  private async pollAuthStatus(args: IPollAuthStatusArgs, context: IRequiredContext): Promise<any> {
    const url = this.uriWithBase('/webapp/auth-status', args.baseUrl)
    const pollingResponse = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        correlationId: args?.correlationId,
        definitionId: args.definitionId,
      }),
    })
    debug(`polling response: ${pollingResponse}`)
    const success = pollingResponse && pollingResponse.status >= 200 && pollingResponse.status < 400
    if (success) {
      return await pollingResponse.json()
    }
    throw Error(`calling ${url} returned ${pollingResponse.status}`)
  }

  private async generateAuthRequest(args: IGenerateAuthRequestArgs, context: IRequiredContext): Promise<IGenerateAuthRequestURIResponse> {
    const url = this.uriWithBase(`/webapp/definitions/${args.definitionId}/auth-request-uri`, args.baseUrl)
    const origResponse = await fetch(url)
    const success = origResponse && origResponse.status >= 200 && origResponse.status < 400
    if (success) {
      return await origResponse.json()
    }
    throw Error(`calling ${url} returned ${origResponse.status}`)
  }

  private uriWithBase(path: string, baseUrl?: string): string {
    if (!this.baseUrl && !baseUrl) {
      throw new Error('You have to provide baseUrl')
    }
    return baseUrl ? `${baseUrl}${path.startsWith('/') ? path : '/' + path}` : `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`
  }
}
