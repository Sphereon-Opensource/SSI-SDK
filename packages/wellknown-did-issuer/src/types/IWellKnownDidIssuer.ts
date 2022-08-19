import {
  IDidConfigurationResource,
  IIssueCallbackArgs,
  IIssueDomainLinkageCredentialArgs,
  IIssueDomainLinkageCredentialOptions,
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

// export interface IIssueDidConfigurationResourceArgs {
//   did: string
//   origin: string
//   issuanceDate?: string;
//   expirationDate: string;
//   options: IIssueDomainLinkageCredentialOptions;
//   issueCallback?: (args: IIssueCallbackArgs) => Promise<ISignedDomainLinkageCredential | string>
// }

export interface IIssueDidConfigurationResourceArgs {
  issuances: Array<IIssuanceArgs>
}

export interface IIssuanceArgs {
  did: string
  origin: string
  issuanceDate?: string;
  expirationDate: string;
  options: IIssueDomainLinkageCredentialOptions;
  issueCallback?: (args: IIssueCallbackArgs) => Promise<ISignedDomainLinkageCredential | string>
}

export interface IAddLinkedDomainsServiceArgs {
  did: string,
  origin: string
}

export type IRequiredContext = IAgentContext<Pick<IDIDManager, 'didManagerGet' | 'didManagerAddService'> & Pick<IKeyManager, 'keyManagerGet' | 'keyManagerSign'>>
