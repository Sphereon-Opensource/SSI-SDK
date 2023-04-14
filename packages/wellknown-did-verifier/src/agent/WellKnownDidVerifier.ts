import { IAgentPlugin, DIDResolutionResult } from '@veramo/core'
import { WellKnownDidVerifier as Verifier, IDomainLinkageValidation, IResourceValidation, VerifyCallback } from '@sphereon/wellknown-dids-client'
import { schema } from '../index'
import {
  IWellKnownDidVerifier,
  IWellKnownDidVerifierOptionsArgs,
  IRegisterSignatureVerificationArgs,
  IRemoveSignatureVerificationArgs,
  IRequiredContext,
  IVerifyDidConfigurationResourceArgs,
  IVerifyDomainLinkageArgs,
} from '../types/IWellKnownDidVerifier'

/**
 * {@inheritDoc IWellKnownDidVerifier}
 */
export class WellKnownDidVerifier implements IAgentPlugin {
  readonly schema = schema.IWellKnownDidVerifier
  readonly methods: IWellKnownDidVerifier = {
    registerSignatureVerification: this.registerSignatureVerification.bind(this),
    removeSignatureVerification: this.removeSignatureVerification.bind(this),
    verifyDomainLinkage: this.verifyDomainLinkage.bind(this),
    verifyDidConfigurationResource: this.verifyDidConfigurationResource.bind(this),
  }

  private readonly signatureVerifications: Record<string, VerifyCallback>
  private readonly onlyVerifyServiceDids: boolean

  constructor(args?: IWellKnownDidVerifierOptionsArgs) {
    this.signatureVerifications = (args && args.signatureVerifications) || {}
    this.onlyVerifyServiceDids = (args && args.onlyVerifyServiceDids) || false
  }

  /** {@inheritDoc IWellKnownDidVerifier.registerSignatureVerification} */
  private async registerSignatureVerification(args: IRegisterSignatureVerificationArgs, context: IRequiredContext): Promise<void> {
    if (this.signatureVerifications[args.callbackName] !== undefined) {
      return Promise.reject(new Error(`Signature validation with key: ${args.callbackName} already present`))
    }

    this.signatureVerifications[args.callbackName] = args.signatureVerification
  }

  /** {@inheritDoc IWellKnownDidVerifier.removeSignatureVerification} */
  private async removeSignatureVerification(args: IRemoveSignatureVerificationArgs, context: IRequiredContext): Promise<boolean> {
    return delete this.signatureVerifications[args.callbackName]
  }

  /** {@inheritDoc IWellKnownDidVerifier.verifyDomainLinkage} */
  private async verifyDomainLinkage(args: IVerifyDomainLinkageArgs, context: IRequiredContext): Promise<IDomainLinkageValidation> {
    const signatureVerification: VerifyCallback =
      typeof args.signatureVerification === 'string'
        ? await this.getSignatureVerification(args.signatureVerification)
        : (args.signatureVerification as VerifyCallback)

    return context.agent.resolveDid({ didUrl: args.did }).then((didResolutionResult: DIDResolutionResult) => {
      if (!didResolutionResult.didDocument) {
        return Promise.reject(Error(`Unable to resolve did: ${args.did}`))
      }

      return new Verifier().verifyDomainLinkage({
        didDocument: didResolutionResult.didDocument,
        verifySignatureCallback: signatureVerification,
        onlyVerifyServiceDid: args.onlyVerifyServiceDids || this.onlyVerifyServiceDids,
      })
    })
  }

  /** {@inheritDoc IWellKnownDidVerifier.verifyDidConfigurationResource} */
  private async verifyDidConfigurationResource(args: IVerifyDidConfigurationResourceArgs, context: IRequiredContext): Promise<IResourceValidation> {
    if (args.configuration && args.origin) {
      return Promise.reject(Error('Cannot supply both a DID configuration resource and an origin.'))
    }

    if (!args.configuration && !args.origin) {
      return Promise.reject(Error('No DID configuration resource or origin supplied.'))
    }

    const signatureVerification: VerifyCallback =
      typeof args.signatureVerification === 'string'
        ? await this.getSignatureVerification(args.signatureVerification)
        : (args.signatureVerification as VerifyCallback)

    return new Verifier().verifyResource({
      verifySignatureCallback: signatureVerification,
      configuration: args.configuration,
      origin: args.origin,
      did: args.did,
    })
  }

  private async getSignatureVerification(key: string): Promise<VerifyCallback> {
    if (this.signatureVerifications[key] === undefined) {
      return Promise.reject(new Error(`Signature validation not found for key: ${key}`))
    }

    return this.signatureVerifications[key]
  }
}
