import { ISingleEndpointOpts } from '@sphereon/ssi-sdk.express-support'
import { IPresentationExchange } from '@sphereon/ssi-sdk.presentation-exchange'
import { ISIOPv2RP } from '@sphereon/ssi-sdk.siopv2-oid4vp-rp-auth'
import { IAgentContext, ICredentialVerifier } from '@veramo/core'

export interface ICreateAuthRequestWebappEndpointOpts extends ISingleEndpointOpts {
  siopBaseURI?: string
  webappAuthStatusPath?: string
  webappBaseURI?: string
}

export type IRequiredPlugins = /*IDataStoreORM & IResolver & IDIDManager & IKeyManager &  */ ICredentialVerifier & ISIOPv2RP & IPresentationExchange
export type IRequiredContext = IAgentContext<IRequiredPlugins>
