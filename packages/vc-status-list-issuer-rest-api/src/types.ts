import { GenericAuthArgs, ISingleEndpointOpts } from '@sphereon/ssi-express-support'
import { IStatusListPlugin } from '@sphereon/ssi-sdk.vc-status-list'
import { IRequiredPlugins } from '@sphereon/ssi-sdk.vc-status-list-issuer-drivers'
import { StatusListType } from '@sphereon/ssi-types'
import { IAgentContext } from '@veramo/core'

export type IRequiredContext = IAgentContext<IRequiredPlugins & IStatusListPlugin>

export interface IStatusListOpts {
  endpointOpts: IStatusListEndpointOpts
  enableFeatures?: statusListFeatures[] // Feature to enable. If not defined or empty, all features will be enabled
}

export interface IStatusListEndpointOpts {
  basePath?: string
  globalAuth?: GenericAuthArgs
  vcApiCredentialStatus: IW3CredentialStatusEndpointOpts
  createStatusList: ICredentialStatusListEndpointOpts
  getStatusList: ICredentialStatusListEndpointOpts
}

export type statusListFeatures = 'w3c-vc-api-credential-status' | 'status-list-management' | 'status-list-hosting'

export interface ICredentialStatusListEndpointOpts extends ISingleEndpointOpts {
  dbName: string
}

export interface IW3CredentialStatusEndpointOpts extends ICredentialStatusListEndpointOpts {
  statusListId?: string
  correlationId?: string
  keyRef?: string
}

export interface UpdateCredentialStatusRequest {
  credentialId: string
  credentialStatus: UpdateCredentialStatusItem[]
  statusListId?: string // Non spec compliant. Allows us to manage multiple status lists. The VC API endpoint also has this config option, allowing for a default
  statusListCorrelationId?: string // Non spec compliant. Allows us to manage multiple status lists. The VC API endpoint also has this config option, allowing for a default
  entryCorrelationId?: string // Non spec compliant. Allows us to manage multiple status lists. The VC API endpoint also has this config option, allowing for a default
}

export interface UpdateCredentialStatusItem {
  type?: StatusListType // makes very little sense, but listed in the spec. Would expect a purpose
  status: string
}
