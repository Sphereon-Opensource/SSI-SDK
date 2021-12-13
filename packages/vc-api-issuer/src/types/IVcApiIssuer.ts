import { IAgentContext, IPluginMethodMap, VerifiableCredential } from '@veramo/core'
import { ICredential } from '@sphereon/ssi-sdk-core'

export interface IVcApiIssuer extends IPluginMethodMap {
  issueCredentialUsingVcApi(args: IIssueCredentialArgs, context: IRequiredContext): Promise<VerifiableCredential>
}

export interface IVcApiIssuerArgs {
  issueUrl: string
  authorizationToken: string
}

export interface IIssueCredentialArgs {
  credential: ICredential
}

export enum events {
  CREDENTIAL_ISSUED = 'credentialIssued',
}

export type IRequiredContext = IAgentContext<Record<string, never>>
