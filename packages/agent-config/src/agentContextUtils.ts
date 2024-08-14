import {
  IAgentContext,
  ICredentialVerifier,
  IDataStore,
  IDataStoreORM,
  IDIDManager,
  IKeyManager,
  IPluginMethodMap,
  IResolver,
  ICredentialIssuer,
  ICredentialStatusVerifier,
} from '@veramo/core'

/**
 * Allows to get a type agent context plugin methods based on provided or inferred types and at least one method for these plugin(s)
 * @param context Tje agent context to check against
 * @param requiredMethod One or more method the plugin provides, so we can check availability and thus plugin presence
 */
export function contextHasPlugin<Plugins extends IPluginMethodMap>(
  context: IAgentContext<any>,
  requiredMethod: string | string[],
): context is IAgentContext<Plugins> {
  const methods = Array.isArray(requiredMethod) ? requiredMethod : [requiredMethod]
  const allMethods = context.agent.availableMethods()
  return methods.every((method) => allMethods.includes(method))
}

/**
 * The below methods are convenience methods to directly get the appropriate context after calling the respective method
 *
 * @param context
 */

export function contextHasKeyManager(context: IAgentContext<IPluginMethodMap>): context is IAgentContext<IKeyManager> {
  return contextHasPlugin(context, 'keyManagerGet')
}

export function contextHasDidManager(context: IAgentContext<IPluginMethodMap>): context is IAgentContext<IResolver & IDIDManager> {
  return contextHasPlugin(context, 'didManagerGet') // IResolver is always required for IDIDManager
}

export function contextHasDidResolver(context: IAgentContext<IPluginMethodMap>): context is IAgentContext<IResolver> {
  return contextHasPlugin(context, 'resolveDid') // IResolver is always required for IDIDManager
}

export function contextHasCredentialIssuer(context: IAgentContext<IPluginMethodMap>): context is IAgentContext<ICredentialIssuer> {
  return contextHasPlugin(context, ['createVerifiableCredential', 'createVerifiablePresentation']) // W3C Credential issuer
}

export function contextHasCredentialVerifier(context: IAgentContext<IPluginMethodMap>): context is IAgentContext<ICredentialVerifier> {
  return contextHasPlugin(context, ['verifyCredential', 'verifyPresentation']) // W3c Credential Verifier
}

export function contextHasCredentialStatusVerifier(context: IAgentContext<IPluginMethodMap>): context is IAgentContext<ICredentialStatusVerifier> {
  return contextHasPlugin(context, ['checkCredentialStatus']) // W3c Credential status Verifier
}

export function contextHasDataStore(context: IAgentContext<IPluginMethodMap>): context is IAgentContext<IDataStore> {
  return contextHasPlugin(context, ['dataStoreGetVerifiableCredential', 'dataStoreGetVerifiablePresentation'])
}

export function contextHasDataStoreORM(context: IAgentContext<IPluginMethodMap>): context is IAgentContext<IDataStoreORM> {
  return contextHasPlugin(context, ['dataStoreORMGetVerifiableCredentials', 'dataStoreORMGetVerifiablePresentations'])
}
