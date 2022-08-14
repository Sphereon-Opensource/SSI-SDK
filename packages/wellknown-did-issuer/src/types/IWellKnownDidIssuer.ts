import {
  IDidConfigurationResource,
  IVerifyCallbackArgs,
  IVerifyCredentialResult,
} from '@sphereon/wellknown-dids-client/dist/types'
import { IAgentContext, IPluginMethodMap, IDIDManager, IKeyManager } from '@veramo/core'

export interface IWellKnownDidIssuer extends IPluginMethodMap {
  registerCredentialIssuance(args: IRegisterIssueCredentialArgs, context: IRequiredContext): Promise<void>,
  removeCredentialIssuance(args: IRemoveCredentialIssuanceArgs, context: IRequiredContext): Promise<boolean>,
  issueDidConfigurationResource(args: IIssueDidConfigurationResourceArgs, context: IRequiredContext): Promise<IDidConfigurationResource>
}

export interface IWellKnownDidIssuerOptionsArgs {
  credentialIssuances?: Record<string, (args: IVerifyCallbackArgs) => Promise<IVerifyCredentialResult>>
  onlyVerifyServiceDids?: boolean
}

export interface IRegisterIssueCredentialArgs {
  callbackName: string
  signatureVerification: (args: IVerifyCallbackArgs) => Promise<IVerifyCredentialResult>
}

export interface IRemoveCredentialIssuanceArgs {
  callbackName: string
}

export interface IIssueDidConfigurationResourceArgs {
  did: string
}






export type IRequiredContext = IAgentContext<Pick<IDIDManager, 'didManagerGet'> & Pick<IKeyManager, 'keyManagerGet' | 'keyManagerSign'>>
