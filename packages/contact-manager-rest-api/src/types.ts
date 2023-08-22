import { GenericAuthArgs, ISingleEndpointOpts } from '@sphereon/ssi-express-support'
import { IContactManager } from '@sphereon/ssi-sdk.contact-manager'
import { IAgentContext } from '@veramo/core'

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
    globalAuth?: GenericAuthArgs & { secureSiopEndpoints?: boolean }
    contactRead?: ISingleEndpointOpts // Overrides read contact entity path
    contactWrite?: ISingleEndpointOpts // Overrides write contact entity path
    contactTypeRead?: ISingleEndpointOpts // Overrides read contact-type entity path
    contactTypeWrite?: ISingleEndpointOpts // Overrides write contact-type entity path
    identityRead?: ISingleEndpointOpts // Overrides read identity entity path
    identityWrite?: ISingleEndpointOpts // Overrides write identity entity path
  }
  enableFeatures?: ContactManagerMRestApiFeatureEnum[]
}

export interface IContactManagerEndpointOpts extends ISingleEndpointOpts {
  basePath?: string
}

export type IRequiredPlugins = IContactManager
export type IRequiredContext = IAgentContext<IRequiredPlugins>
