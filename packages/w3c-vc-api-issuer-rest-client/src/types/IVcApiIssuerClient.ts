import { CredentialPayload, IAgentContext, IPluginMethodMap } from '@veramo/core'
import { VerifiableCredentialSP } from '@sphereon/ssi-sdk.core'

export interface IVcApiIssuerClient extends IPluginMethodMap {
  vcApiClientIssueCredential(args: IIssueCredentialArgs, context: IRequiredContext): Promise<VerifiableCredentialSP>
}

export interface IVcApiIssuerArgs {
  issueUrl: string
  authorizationToken: string
}

export interface IIssueCredentialArgs {
  credential: CredentialPayload
}

export enum events {
  CREDENTIAL_ISSUED = 'credentialIssued',
}

export type IRequiredContext = IAgentContext<Record<string, never>>
