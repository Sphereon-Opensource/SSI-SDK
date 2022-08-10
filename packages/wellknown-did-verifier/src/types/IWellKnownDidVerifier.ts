import {
  IDidConfigurationResource,
  IDomainLinkageValidation,
  IVerifyCallbackArgs,
  IVerifyCredentialResult,
  IResourceValidation
} from '@sphereon/wellknown-dids-client/dist/types'
import {
  IAgentContext,
  IPluginMethodMap,
  IResolver
} from '@veramo/core'

export interface IWellKnownDidVerifier extends IPluginMethodMap {
  registerSignatureVerification(args: IRegisterSignatureVerificationArgs, context: IRequiredContext): Promise<void>,
  removeSignatureVerification(args: IRemoveSignatureVerificationArgs, context: IRequiredContext): Promise<boolean>,
  verifyDomainLinkage(args: IVerifyDomainLinkageArgs, context: IRequiredContext): Promise<IDomainLinkageValidation>,
  verifyDidConfigurationResource(args: IVerifyDidConfigurationResourceArgs, context: IRequiredContext): Promise<IResourceValidation>
}

export interface IWellKnownDidVerifierOptionsArgs {
  signatureVerifications?: Record<string, (args: IVerifyCallbackArgs) => Promise<IVerifyCredentialResult>>
  onlyVerifyServiceDids?: boolean
}

export interface IRegisterSignatureVerificationArgs {
  key: string
  signatureVerification: (args: IVerifyCallbackArgs) => Promise<IVerifyCredentialResult>
}

export interface IRemoveSignatureVerificationArgs {
  key: string
}

export interface IVerifyDomainLinkageArgs {
  didUrl: string
  signatureVerification: ((args: IVerifyCallbackArgs) => Promise<IVerifyCredentialResult>) | string
  onlyVerifyServiceDids?: boolean
}

export interface IVerifyDidConfigurationResourceArgs {
  signatureVerification: ((args: IVerifyCallbackArgs) => Promise<IVerifyCredentialResult>) | string
  configuration?: IDidConfigurationResource;
  origin?: string;
  did?: string
}

export type IRequiredContext = IAgentContext<IResolver>
