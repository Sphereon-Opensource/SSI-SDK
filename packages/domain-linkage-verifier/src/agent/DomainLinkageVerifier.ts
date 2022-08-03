import {
  IAgentPlugin,
  DIDResolutionResult
} from '@veramo/core'
import {
  DomainLinkageVerifier as DLV,
  IDomainLinkageValidation,
  IResourceValidation,
  IVerifyCallbackArgs
}  from '@sphereon/domain-linkage-client'
import { schema } from '../index'
import {
  IDomainLinkageVerifier,
  IRequiredContext,
  IVerifyDidConfigurationResourceArgs,
  IVerifyDomainLinkageArgs
} from '../types/IDomainLinkageVerifier'

/**
 * {@inheritDoc IConnectionManager}
 */
export class DomainLinkageVerifier implements IAgentPlugin {
  readonly schema = schema.IDomainLinkageVerifier
  readonly methods: IDomainLinkageVerifier = {
    verifyDomainLinkage: this.verifyDomainLinkage.bind(this),
    verifyDidConfigurationResource: this.verifyDidConfigurationResource.bind(this)
  }

  // TODO options with resolver?

  /** {@inheritDoc IDomainLinkageVerifier.verifyDomainLinkage} */
  private async verifyDomainLinkage(args: IVerifyDomainLinkageArgs, context: IRequiredContext): Promise<IDomainLinkageValidation> {
    const verifierConfig = {
      issueCallback: (args: IVerifyCallbackArgs) => context.agent.verifyCredential({ credential: args.credential })
    }

    return context.agent.resolveDid(args)
      .then((didResolutionResult: DIDResolutionResult) => new DLV(verifierConfig)
        .verifyDomainLinkage({ didDocument: didResolutionResult.didDocument }))
  }

  /** {@inheritDoc IDomainLinkageVerifier.verifyDidConfigurationResource} */
  private async verifyDidConfigurationResource(args: IVerifyDidConfigurationResourceArgs, context: IRequiredContext): Promise<IResourceValidation> {
    return new DLV().verifyResource(args)
  }

}
