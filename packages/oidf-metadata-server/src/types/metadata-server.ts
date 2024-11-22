import { IAgentContext } from '@veramo/core'
import { IOIDFMetadataStore } from './metadata-store'

export enum FederationEndpoints {
  WELL_KNOWN_OPENID_FEDERATION = '/.well-known/openid-federation',
}

export type IRequiredContext = IAgentContext<IPlugins>

export type IPlugins = IOIDFMetadataStore

export interface FederationMetadataServerOpts {
  storeId?: string
  namespace?: string
}
