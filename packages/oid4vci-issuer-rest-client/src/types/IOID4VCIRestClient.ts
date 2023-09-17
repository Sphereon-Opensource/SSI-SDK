import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import {
  CredentialOfferFormat,
  Grant,
  IssueStatusResponse,
  CredentialDataSupplierInput,
  CreateCredentialOfferURIResult,
} from '@sphereon/oid4vci-common'

export interface IOID4VCIRestClient extends IPluginMethodMap {
  oid4vciClientCreateOfferUri(args: IOID4VCIClientCreateOfferUriRequestArgs, context: IRequiredContext): Promise<IOID4VCIClientCreateOfferUriResponse>
  oid4vciClientGetIssueStatus(args: IOID4VCIClientGetIssueStatusArgs, context: IRequiredContext): Promise<IssueStatusResponse>
}

export interface IOID4VCIClientCreateOfferUriRequestArgs extends IOID4VCIClientCreateOfferUriRequest {
  agentBaseUrl?: string
}

export interface IRestClientAuthenticationOpts {
  enabled?: boolean
  staticBearerToken?: string
}

export interface IOID4VCIClientGetIssueStatusArgs {
  id: string
  baseUrl?: string
}

export type IOID4VCIClientCreateOfferUriResponse = Omit<CreateCredentialOfferURIResult, 'session'>

export interface IOID4VCIClientCreateOfferUriRequest {
  credentials: (CredentialOfferFormat | string)[]
  grants: Grant
  credentialDataSupplierInput?: CredentialDataSupplierInput
}

export type IRequiredContext = IAgentContext<never>
