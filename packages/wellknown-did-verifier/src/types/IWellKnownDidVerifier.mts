import { IDidConfigurationResource, IDomainLinkageValidation, IResourceValidation, VerifyCallback } from '@sphereon/wellknown-dids-client'
import { IAgentContext, IPluginMethodMap, IResolver } from '@veramo/core'

export interface IWellKnownDidVerifier extends IPluginMethodMap {
  registerSignatureVerification(args: IRegisterSignatureVerificationArgs, context: IRequiredContext): Promise<void>
  removeSignatureVerification(args: IRemoveSignatureVerificationArgs, context: IRequiredContext): Promise<boolean>
  verifyDomainLinkage(args: IVerifyDomainLinkageArgs, context: IRequiredContext): Promise<IDomainLinkageValidation>
  verifyDidConfigurationResource(args: IVerifyDidConfigurationResourceArgs, context: IRequiredContext): Promise<IResourceValidation>
}

export interface IWellKnownDidVerifierOptionsArgs {
  signatureVerifications?: Record<string, VerifyCallback>
  onlyVerifyServiceDids?: boolean
}

export interface IRegisterSignatureVerificationArgs {
  callbackName: string
  signatureVerification: VerifyCallback
}

export interface IRemoveSignatureVerificationArgs {
  callbackName: string
}

export interface IVerifyDomainLinkageArgs {
  did: string
  signatureVerification: VerifyCallback | string
  onlyVerifyServiceDids?: boolean
}

export interface IVerifyDidConfigurationResourceArgs {
  signatureVerification: VerifyCallback | string
  configuration?: IDidConfigurationResource
  origin?: string
  did?: string
}

export type IRequiredContext = IAgentContext<IResolver>
