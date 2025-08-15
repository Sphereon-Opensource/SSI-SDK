import type { IAgentContext, IDIDManager, IKeyManager, IPluginMethodMap } from '@veramo/core'
import type {
  ExternalIdentifierCoseKeyOpts,
  ExternalIdentifierCoseKeyResult,
  ExternalIdentifierDidOpts,
  ExternalIdentifierDidResult,
  ExternalIdentifierJwkOpts,
  ExternalIdentifierJwkResult,
  ExternalIdentifierOIDFEntityIdOpts,
  ExternalIdentifierOIDFEntityIdResult,
  ExternalIdentifierOpts,
  ExternalIdentifierResult,
  ExternalIdentifierX5cOpts,
  ExternalIdentifierX5cResult,
} from './externalIdentifierTypes'
import type {
  ManagedIdentifierCoseKeyOpts,
  ManagedIdentifierCoseKeyResult,
  ManagedIdentifierDidOpts,
  ManagedIdentifierDidResult,
  ManagedIdentifierJwkOpts,
  ManagedIdentifierJwkResult,
  ManagedIdentifierKeyOpts,
  ManagedIdentifierKeyResult,
  ManagedIdentifierKidOpts,
  ManagedIdentifierKidResult,
  ManagedIdentifierOID4VCIssuerOpts,
  ManagedIdentifierOID4VCIssuerResult,
  ManagedIdentifierOptsOrResult,
  ManagedIdentifierResult,
  ManagedIdentifierX5cOpts,
  ManagedIdentifierX5cResult,
} from './managedIdentifierTypes'

// Exposing the methods here for any REST implementation
export const identifierResolutionContextMethods: Array<string> = [
  'identifierManagedGet',
  'identifierManagedGetByDid',
  'identifierManagedGetByKid',
  'identifierManagedGetByJwk',
  'identifierManagedGetByX5c',
  'identifierManagedGetByKey',
  'identifierManagedGetByOID4VCIssuer',
  'identifierManagedGetByCoseKey',
  'identifierExternalResolve',
  'identifierExternalResolveByDid',
  'identifierExternalResolveByX5c',
  'identifierExternalResolveByJwk',
  'identifierExternalResolveByCoseKey',
  'identifierExternalResolveByOIDFEntityId',
]

/**
 * @public
 */
export interface IIdentifierResolution extends IPluginMethodMap {
  /**
   * Main method for managed identifiers. We always go through this method (also the others) as we want to integrate a plugin for anomaly detection. Having a single method helps
   *
   * The end result of all these methods is a common baseline response that allows to use a key from the registered KMS systems. It also provides kid and iss(uer) values that can be used in a JWT/JWS for instance
   * Allows to get a managed identifier result in case identifier options are passed in, but returns the identifier directly in case results are passed in. This means resolution can have happened before, or happens in this method
   *
   * We use the opts or result type almost everywhere, as it allows for just in time resolution whenever this method is called and afterwards we have the result, so resolution doesn't have to hit the DB, or external endpoints.
   * Also use this method in the local agent, not using REST. If case the identifier needs to be resolved, you can always have the above methods using REST
   * @param args
   * @param context
   * @public
   */
  identifierManagedGet(args: ManagedIdentifierOptsOrResult, context: IAgentContext<IKeyManager>): Promise<ManagedIdentifierResult>

  identifierManagedGetByDid(args: ManagedIdentifierDidOpts, context: IAgentContext<IKeyManager & IDIDManager>): Promise<ManagedIdentifierDidResult>

  identifierManagedGetByKid(args: ManagedIdentifierKidOpts, context: IAgentContext<IKeyManager>): Promise<ManagedIdentifierKidResult>

  identifierManagedGetByJwk(args: ManagedIdentifierJwkOpts, context: IAgentContext<IKeyManager>): Promise<ManagedIdentifierJwkResult>

  identifierManagedGetByX5c(args: ManagedIdentifierX5cOpts, context: IAgentContext<IKeyManager>): Promise<ManagedIdentifierX5cResult>

  identifierManagedGetByKey(args: ManagedIdentifierKeyOpts, context: IAgentContext<IKeyManager>): Promise<ManagedIdentifierKeyResult>

  identifierManagedGetByCoseKey(
    args: ManagedIdentifierCoseKeyOpts,
    context: IAgentContext<IKeyManager & IIdentifierResolution>
  ): Promise<ManagedIdentifierCoseKeyResult>

  identifierManagedGetByOID4VCIssuer(
    args: ManagedIdentifierOID4VCIssuerOpts,
    context: IAgentContext<any>
  ): Promise<ManagedIdentifierOID4VCIssuerResult>

  // TODO: We can create a custom managed identifier method allowing developers to register a callback function to get their implementation hooked up. Needs more investigation as it would also impact the KMS

  /**
   * Main method for external identifiers. We always go through this method (also the others) as we want to integrate a plugin for anomaly detection. Having a single method helps
   * @param args
   * @param context
   * @public
   */
  identifierExternalResolve(args: ExternalIdentifierOpts, context: IAgentContext<any>): Promise<ExternalIdentifierResult>

  identifierExternalResolveByDid(args: ExternalIdentifierDidOpts, context: IAgentContext<any>): Promise<ExternalIdentifierDidResult>

  identifierExternalResolveByJwk(args: ExternalIdentifierJwkOpts, context: IAgentContext<any>): Promise<ExternalIdentifierJwkResult>

  identifierExternalResolveByCoseKey(args: ExternalIdentifierCoseKeyOpts, context: IAgentContext<any>): Promise<ExternalIdentifierCoseKeyResult>

  identifierExternalResolveByX5c(args: ExternalIdentifierX5cOpts, context: IAgentContext<any>): Promise<ExternalIdentifierX5cResult>

  identifierExternalResolveByOIDFEntityId(
    args: ExternalIdentifierOIDFEntityIdOpts,
    context: IAgentContext<any>
  ): Promise<ExternalIdentifierOIDFEntityIdResult>
}
