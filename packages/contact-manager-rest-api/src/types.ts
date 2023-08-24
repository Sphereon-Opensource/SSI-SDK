import { GenericAuthArgs, ISingleEndpointOpts } from '@sphereon/ssi-express-support'
import { IContactManager } from '@sphereon/ssi-sdk.contact-manager'
import { IAgentContext, IDataStore, IKeyManager } from '@veramo/core'

export enum ContactManagerMRestApiFeatureEnum {
  contact_read = 'contact_read',
  contact_write = 'contact_write',
  contact_type_read = 'contact_type_read',
  contact_type_write = 'contact_type_write',
  identity_read = 'identity_read',
  identity_write = 'identity_write',
}

export interface IContactManagerAPIEndpointOpts {
  endpointOpts?: {
    basePath?: string
    globalAuth?: GenericAuthArgs & { secureContactManagerEndpoints?: boolean }
    contactRead?: ISingleEndpointOpts // Overrides read contact entity path
    contactWrite?: ISingleEndpointOpts // Overrides write contact entity path
    contactTypeRead?: ISingleEndpointOpts // Overrides read contact-type entity path
    contactTypeWrite?: ISingleEndpointOpts // Overrides write contact-type entity path
    identityRead?: ISingleEndpointOpts // Overrides read identity entity path
    identityWrite?: ISingleEndpointOpts // Overrides write identity entity path
  }
  enableFeatures?: ContactManagerMRestApiFeatureEnum[]
}

export type IRequiredPlugins = IContactManager & IDataStore & IKeyManager
export type IRequiredContext = IAgentContext<IRequiredPlugins>
