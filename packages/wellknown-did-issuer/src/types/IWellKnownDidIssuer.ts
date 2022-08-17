import {
  IDidConfigurationResource,
  IIssueCallbackArgs,
  IIssueDomainLinkageCredentialArgs,
  ISignedDomainLinkageCredential,
} from '@sphereon/wellknown-dids-client/dist/types'
import { IAgentContext, IPluginMethodMap, IDIDManager, IKeyManager } from '@veramo/core'

export interface IWellKnownDidIssuer extends IPluginMethodMap {
  registerCredentialIssuance(args: IRegisterIssueCredentialArgs, context: IRequiredContext): Promise<void>,
  removeCredentialIssuance(args: IRemoveCredentialIssuanceArgs, context: IRequiredContext): Promise<boolean>,
  issueDidConfigurationResource(args: IIssueDidConfigurationResourceArgs, context: IRequiredContext): Promise<IDidConfigurationResource>,
  issueDomainLinkageCredential(args: IIssueDomainLinkageCredentialArgs): Promise<ISignedDomainLinkageCredential | string>
}

export interface IWellKnownDidIssuerOptionsArgs {
  credentialIssuances?: Record<string, (args: IIssueCallbackArgs) => Promise<ISignedDomainLinkageCredential | string>>
}

export interface IRegisterIssueCredentialArgs {
  callbackName: string
  credentialIssuance: (args: IIssueCallbackArgs) => Promise<ISignedDomainLinkageCredential | string>
}

export interface IRemoveCredentialIssuanceArgs {
  callbackName: string
}

export interface IIssueDidConfigurationResourceArgs {
  did: string
  origins: Array<string>
  issueCallback?: (args: IIssueCallbackArgs) => Promise<ISignedDomainLinkageCredential | string>
}

export type IRequiredContext = IAgentContext<Pick<IDIDManager, 'didManagerGet' | 'didManagerAddService'> & Pick<IKeyManager, 'keyManagerGet' | 'keyManagerSign'>>
