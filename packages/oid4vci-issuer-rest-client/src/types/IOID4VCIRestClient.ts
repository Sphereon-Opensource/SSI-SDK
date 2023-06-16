import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { CredentialOfferFormat, Grant, IssueStatusResponse } from '@sphereon/oid4vci-common'

export interface IOID4VCIRestClient extends IPluginMethodMap {
  oid4vciClientCreateOfferUri(args: IOID4VCIClientCreateOfferUriRequestArgs, context: IRequiredContext): Promise<IOID4VCIClientCreateOfferUriResponse>
  oid4vciClientGetIssueStatus(args: IOID4VCIClientGetIssueStatusArgs, context: IRequiredContext): Promise<IssueStatusResponse>
}

export interface IOID4VCIClientCreateOfferUriRequestArgs {
  grants: Grant
  credentials: (CredentialOfferFormat | string)[]
  baseUrl?: string
}

export interface IOID4VCIClientGetIssueStatusArgs {
  id: string
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
