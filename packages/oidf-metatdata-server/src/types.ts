import { IAgentContext } from '@veramo/core'
import { IOID4VCIStore } from '@sphereon/ssi-sdk.oid4vci-issuer-store'

export enum FederationEndpoints {
  WELL_KNOWN_OPENID_FEDERATION = '/.well-known/openid-federation',
}

export type IRequiredContext = IAgentContext<IPlugins>

export type IPlugins = IOID4VCIStore

export interface IOID4MetadataServerOpts {
  storeId?: string
  namespace?: string
}

export interface OpenidFederationMetadata {
  subjectBaseUrl: string
  jwt: string
  enabled: boolean
}
