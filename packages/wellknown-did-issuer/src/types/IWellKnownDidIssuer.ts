import {
  DomainLinkageCredential,
  IDidConfigurationResource,
  IIssueDomainLinkageCredentialOptions,
  IssuanceCallback,
} from '@sphereon/wellknown-dids-client'
import { IAgentContext, IPluginMethodMap, IDIDManager } from '@veramo/core'
import { ICredentialStore } from '@sphereon/ssi-sdk.credential-store'

export interface IWellKnownDidIssuer extends IPluginMethodMap {
  addLinkedDomainsService(args: IAddLinkedDomainsServiceArgs, context: RequiredContext): Promise<void>
  getDidConfigurationResource(args: IGetDidConfigurationResourceArgs, context: RequiredContext): Promise<IDidConfigurationResource>
  issueDidConfigurationResource(args: IIssueDidConfigurationResourceArgs, context: RequiredContext): Promise<IDidConfigurationResource>
  issueDomainLinkageCredential(args: IIssueDomainLinkageCredentialArgs, context: RequiredContext): Promise<DomainLinkageCredential>
  registerCredentialIssuance(args: IRegisterIssueCredentialArgs, context: RequiredContext): Promise<void>
  removeCredentialIssuance(args: IRemoveCredentialIssuanceArgs, context: RequiredContext): Promise<boolean>
  saveDidConfigurationResource(args: ISaveDidConfigurationResourceArgs, context: RequiredContext): Promise<void>
}

export interface IWellKnownDidIssuerOptionsArgs {
  credentialIssuances?: Record<string, IssuanceCallback>
}

export interface IRegisterIssueCredentialArgs {
  callbackName: string
  credentialIssuance: IssuanceCallback
}

export interface IRemoveCredentialIssuanceArgs {
  callbackName: string
}

export interface IIssueDidConfigurationResourceArgs {
  issuances: Array<IIssueDomainLinkageCredentialArgs>
  credentialIssuance?: string | IssuanceCallback
  save?: boolean
}

export interface IIssueDomainLinkageCredentialArgs {
  did: string
  origin: string
  serviceId?: string
  issuanceDate?: string
  expirationDate: string
  save?: boolean
  options: IIssueDomainLinkageCredentialOptions
  credentialIssuance?: string | IssuanceCallback
}

export interface IGetDidConfigurationResourceArgs {
  origin: string
}

export interface IAddLinkedDomainsServiceArgs {
  did: string
  origin: string
  serviceId?: string
}

export interface ISaveDidConfigurationResourceArgs {
  origin: string
  didConfigurationResource: IDidConfigurationResource
}

export type RequiredContext = IAgentContext<IDIDManager & ICredentialStore>
