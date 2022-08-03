import {
  IAgentContext,
  IPluginMethodMap,
  IResolver
} from '@veramo/core'

import { ICredentialIssuer } from '@veramo/credential-w3c'
import { IDidConfigurationResource }  from '@sphereon/domain-linkage-client'

export interface IDomainLinkageVerifier extends IPluginMethodMap {
  verifyDomainLinkage(args: IVerifyDomainLinkageArgs, context: IRequiredContext): Promise<void>,
  verifyDidConfigurationResource(args: IVerifyDidConfigurationResourceArgs, context: IRequiredContext): Promise<void>
}

export interface IVerifyDomainLinkageArgs {
  didUrl: string
}

export interface IVerifyDidConfigurationResourceArgs {
  resource: IDidConfigurationResource | string,
  didUrl?: string
}

export type IRequiredContext = IAgentContext<IResolver | ICredentialIssuer>
