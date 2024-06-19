import { BearerTokenArg } from '@sphereon/ssi-types'
import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import {
  IssueStatusResponse,
  CredentialDataSupplierInput,
  CreateCredentialOfferURIResult,
  CredentialOfferPayloadV1_0_13,
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
  bearerToken?: BearerTokenArg
}

export interface IOID4VCIClientGetIssueStatusArgs {
  id: string
  baseUrl?: string
}

export type IOID4VCIClientCreateOfferUriResponse = Omit<CreateCredentialOfferURIResult, 'session'>

export interface IOID4VCIClientCreateOfferUriRequest extends CredentialOfferPayloadV1_0_13 {
  credentialDataSupplierInput?: CredentialDataSupplierInput
}

export type IRequiredContext = IAgentContext<never>
