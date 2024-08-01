import { GenericAuthArgs, ISingleEndpointOpts } from '@sphereon/ssi-express-support'
import { IContactManager } from '@sphereon/ssi-sdk.contact-manager'
import { IAgentContext, IDIDManager, IKeyManager } from '@veramo/core'

export type ContactManagerMRestApiFeatures = 'party_read' | 'party_write' | 'party_type_read' | 'identity_read'

export interface IContactManagerAPIEndpointOpts {
  endpointOpts?: {
    basePath?: string
    globalAuth?: GenericAuthArgs & { secureContactManagerEndpoints?: boolean }
    partyRead?: ISingleEndpointOpts // Overrides read party entity path
    partyWrite?: ISingleEndpointOpts // Overrides write party entity path
    partyTypeRead?: ISingleEndpointOpts // Overrides read party-type entity path
    identityRead?: ISingleEndpointOpts // Overrides read identity entity path
  }
  enableFeatures?: ContactManagerMRestApiFeatures[]
}

export type IRequiredPlugins = IContactManager & IKeyManager & IDIDManager
export type IRequiredContext = IAgentContext<IRequiredPlugins>
