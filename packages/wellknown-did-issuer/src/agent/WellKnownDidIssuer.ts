import { IAgentPlugin, IIdentifier } from '@veramo/core'
import { WellKnownDidIssuer as Issuer } from '@sphereon/wellknown-dids-client'
import {
  IDidConfigurationResource,
  IIssueCallbackArgs,
  IIssueDomainLinkageCredentialArgs,
  ISignedDomainLinkageCredential,
  ServiceTypesEnum,
} from '@sphereon/wellknown-dids-client/dist/types'
import { schema } from '../index'
import {
  IWellKnownDidIssuer,
  IWellKnownDidIssuerOptionsArgs,
  IRegisterIssueCredentialArgs,
  IRemoveCredentialIssuanceArgs,
  IRequiredContext,
  IIssueDidConfigurationResourceArgs
} from '../types/IWellKnownDidIssuer'
import { Service } from 'did-resolver/lib/resolver';

/**
 * {@inheritDoc IWellKnownDidIssuer}
 */
export class WellKnownDidIssuer implements IAgentPlugin {
  readonly schema = schema.IWellKnownDidVerifier
  readonly methods: IWellKnownDidIssuer = {
    registerCredentialIssuance: this.registerCredentialIssuance.bind(this),
    removeCredentialIssuance: this.removeCredentialIssuance.bind(this),
    issueDidConfigurationResource: this.issueDidConfigurationResource.bind(this),
    issueDomainLinkageCredential: this.issueDomainLinkageCredential.bind(this),
  }

  private readonly credentialIssuances: Record<string, (args: IIssueCallbackArgs) => Promise<ISignedDomainLinkageCredential | string>>

  constructor(args?: IWellKnownDidIssuerOptionsArgs) {
    this.credentialIssuances = (args && args.credentialIssuances) || {}
  }

  /** {@inheritDoc IWellKnownDidIssuer.registerSignatureVerification} */
  private async registerCredentialIssuance(args: IRegisterIssueCredentialArgs, context: IRequiredContext): Promise<void> {
    if (this.credentialIssuances[args.callbackName] !== undefined) {
      return Promise.reject(new Error(`Credential issuance with key: ${args.callbackName} already present`))
    }

    this.credentialIssuances[args.callbackName] = args.credentialIssuance
  }

  /** {@inheritDoc IWellKnownDidIssuer.removeSignatureVerification} */
  private async removeCredentialIssuance(args: IRemoveCredentialIssuanceArgs, context: IRequiredContext): Promise<boolean> {
    return delete this.credentialIssuances[args.callbackName]
  }

  /** {@inheritDoc IWellKnownDidIssuer.issueDidConfigurationResource} */
  private async issueDidConfigurationResource(args: IIssueDidConfigurationResourceArgs, context: IRequiredContext): Promise<IDidConfigurationResource> { //IDidConfigurationResource
    // if (new URL(args.origin).origin !== args.origin) {
    //   return Promise.reject(Error('Origin is not valid'))
    // }
    //
    // if (new URL(args.origin).protocol !== 'https:') {
    //   return Promise.reject('Origin is not secure')
    // }

    // TODO check if any origin is suplied

    // TODO do i check if there is already a service for the given origin?

    // TODO parse did

    return context.agent.didManagerGet({ did: args.did })
      .catch(() => Promise.reject(Error('DID cannot be found')))
      .then(async (identifier: IIdentifier) => {
        if (!identifier.services || identifier.services.filter((service: Service) => service.type = ServiceTypesEnum.LINKED_DOMAINS).length === 0) {
          await context.agent.didManagerAddService({
            did: identifier.did,
            service: {
              id: identifier.did, // TODO uuid?
              type: ServiceTypesEnum.LINKED_DOMAINS,
              serviceEndpoint: (args.origins.length < 2)
                ? args.origins[0]
                : { origins: args.origins }// TODO could be multiple in string array
            }
          })
        }
      })
      .catch((error: Error) => Promise.reject(Error(`Unable to add LinkedDomains service to DID. Error: ${error.message}`)))
      .then(() =>
          new Issuer().issueDidConfigurationResource({
            issuances: [{
              did: args.did,
              origin: args.origin,
              expirationDate: args.expirationDate,
              options: args.options
            }]
          })
      )
      .catch((error: Error) => Promise.reject(Error(`Unable to issue DID configuration resource. Error: ${error.message}`)))
  }

  public async issueDomainLinkageCredential(args: IIssueDomainLinkageCredentialArgs): Promise<ISignedDomainLinkageCredential | string> {
    return new Issuer().issueDomainLinkageCredential({
      did: args.did,
      origin: args.origin,
      expirationDate: args.expirationDate,
      options: args.options
    })
  }

}
