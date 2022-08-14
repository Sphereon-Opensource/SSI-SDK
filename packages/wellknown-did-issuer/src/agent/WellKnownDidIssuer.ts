import { IAgentPlugin, IIdentifier } from '@veramo/core'
import { WellKnownDidIssuer as Issuer } from '@sphereon/wellknown-dids-client'
import {
  IDidConfigurationResource,
  IVerifyCallbackArgs,
  IVerifyCredentialResult,
} from '@sphereon/wellknown-dids-client/dist/types'
import {IIssueDidConfigurationResourceArgs, schema} from '../index'
import {
  IWellKnownDidIssuer,
  IWellKnownDidIssuerOptionsArgs,
  IRegisterIssueCredentialArgs,
  IRemoveCredentialIssuanceArgs,
  IRequiredContext,
} from '../types/IWellKnownDidIssuer'

/**
 * {@inheritDoc IWellKnownDidIssuer}
 */
export class WellKnownDidIssuer implements IAgentPlugin {
  readonly schema = schema.IWellKnownDidVerifier
  readonly methods: IWellKnownDidIssuer = {
    registerCredentialIssuance: this.registerCredentialIssuance.bind(this),
    removeCredentialIssuance: this.removeCredentialIssuance.bind(this),
    issueDidConfigurationResource: this.issueDidConfigurationResource.bind(this),
  }

  private readonly credentialIssuances: Record<string, (args: IVerifyCallbackArgs) => Promise<IVerifyCredentialResult>>

  constructor(args?: IWellKnownDidIssuerOptionsArgs) {
    this.credentialIssuances = (args && args.credentialIssuances) || {}
  }

  /** {@inheritDoc IWellKnownDidIssuer.registerSignatureVerification} */
  private async registerCredentialIssuance(args: IRegisterIssueCredentialArgs, context: IRequiredContext): Promise<void> {
    if (this.credentialIssuances[args.callbackName] !== undefined) {
      return Promise.reject(new Error(`Credential issuance with key: ${args.callbackName} already present`))
    }

    this.credentialIssuances[args.callbackName] = args.signatureVerification
  }

  /** {@inheritDoc IWellKnownDidIssuer.removeSignatureVerification} */
  private async removeCredentialIssuance(args: IRemoveCredentialIssuanceArgs, context: IRequiredContext): Promise<boolean> {
    return delete this.credentialIssuances[args.callbackName]
  }

  /** {@inheritDoc IWellKnownDidIssuer.issueDidConfigurationResource} */
  private async issueDidConfigurationResource(args: IIssueDidConfigurationResourceArgs, context: IRequiredContext): Promise<IDidConfigurationResource> {

    // TODO parse did

    return context.agent.didManagerGet({ did: args.did })
      .then((identifier: IIdentifier) => {

      })
      .catch((error) => console.log(error))



    // return new Issuer().issueDidConfigurationResource({
    //   verifySignatureCallback: signatureVerification,
    //   configuration: args.configuration,
    //   origin: args.origin,
    //   did: args.did,
    // })
  }



}
