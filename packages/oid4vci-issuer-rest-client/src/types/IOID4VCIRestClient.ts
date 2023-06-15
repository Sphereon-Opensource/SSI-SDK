import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { CredentialOfferFormat, Grant } from '@sphereon/oid4vci-common'

export interface IOID4VCIRestClient extends IPluginMethodMap {
  oid4vciClientCreateOfferUri(args: IOID4VCIClientCreateOfferUriRequestArgs, context: IRequiredContext): Promise<IOID4VCIClientCreateOfferUriResponse>
}

export interface IOID4VCIClientCreateOfferUriRequestArgs {
  grants: Grant
  credentials: (CredentialOfferFormat | string)[]
  baseUrl?: string
}

export interface IOID4VCIClientCreateOfferUriResponse {
  uri: string
}

export interface IOID4VCIClientCreateOfferUriRequest {
  credentials: (CredentialOfferFormat | string)[]
  grants: Grant
}

export type IRequiredContext = IAgentContext<never>
