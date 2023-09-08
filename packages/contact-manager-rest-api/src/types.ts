import { GenericAuthArgs, ISingleEndpointOpts } from '@sphereon/ssi-express-support'
import { IContactManager } from '@sphereon/ssi-sdk.contact-manager'
import { IAgentContext, IDataStore, IKeyManager } from '@veramo/core'

export enum ContactManagerMRestApiFeatureEnum {
  party_read = 'party_read',
  party_write = 'party_write',
  party_type_read = 'party_type_read',
  party_type_write = 'party_type_write',
  identity_read = 'identity_read',
  identity_write = 'identity_write',
}

export interface IContactManagerAPIEndpointOpts {
  endpointOpts?: {
    basePath?: string
    globalAuth?: GenericAuthArgs & { secureContactManagerEndpoints?: boolean }
    partyRead?: ISingleEndpointOpts // Overrides read party entity path
    partyWrite?: ISingleEndpointOpts // Overrides write party entity path
    partyTypeRead?: ISingleEndpointOpts // Overrides read party-type entity path
    partyTypeWrite?: ISingleEndpointOpts // Overrides write party-type entity path
    identityRead?: ISingleEndpointOpts // Overrides read identity entity path
    identityWrite?: ISingleEndpointOpts // Overrides write identity entity path
  }
  enableFeatures?: ContactManagerMRestApiFeatureEnum[]
}

export type IRequiredPlugins = IContactManager & IDataStore & IKeyManager
export type IRequiredContext = IAgentContext<IRequiredPlugins>
