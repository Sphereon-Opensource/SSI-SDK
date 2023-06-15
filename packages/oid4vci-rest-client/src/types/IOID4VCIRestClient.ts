import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { CredentialOfferFormat, Grant } from '@sphereon/oid4vci-common'

export interface IOID4VCIRestClient extends IPluginMethodMap {
  vciClientCreateOfferUri(args: IVCIClientCreateOfferUriRequestArgs, context: IRequiredContext): Promise<IVCIClientCreateOfferUriResponse>
}

export interface IVCIClientCreateOfferUriRequestArgs {
  grants: Grant
  credentials: (CredentialOfferFormat | string)[]
  baseUri?: string
}

export interface IVCIClientCreateOfferUriResponse {
  uri: string
}

export interface IVCIClientCreateOfferUriRequest {
  credentials: (CredentialOfferFormat | string)[]
  grants?: Grant
}

export type IRequiredContext = IAgentContext<never>
