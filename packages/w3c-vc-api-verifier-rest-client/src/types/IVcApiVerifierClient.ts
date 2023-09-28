import { CredentialPayload, IAgentContext, IPluginMethodMap } from '@veramo/core'

export interface IVcApiVerifierClient extends IPluginMethodMap {
  vcApiClientVerifyCredential(args: IVerifyCredentialArgs, context: IRequiredContext): Promise<IVerifyCredentialResult>
}

export interface IVcApiVerifierArgs {
  verifyUrl: string
}

export interface IVerifyCredentialArgs {
  credential: CredentialPayload
}

export interface IVerifyCredentialResult {
  checks: string[]
  errors: string[]
  warnings: string[]
}

export enum events {
  CREDENTIAL_VERIFIED = 'credentialVerified',
}

export type IRequiredContext = IAgentContext<Record<string, never>>
