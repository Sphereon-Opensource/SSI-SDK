import {
  IAgentContext,
  ICredentialIssuer,
  ICredentialPlugin,
  ICredentialVerifier,
  IDataStore,
  IDataStoreORM,
  IDIDManager,
  IKeyManager,
  IResolver,
} from '@veramo/core'

export type IRequiredPlugins = IDataStore &
  IDataStoreORM &
  IDIDManager &
  IKeyManager &
  ICredentialIssuer &
  ICredentialVerifier &
  ICredentialPlugin &
  IResolver
export type IRequiredContext = IAgentContext<IRequiredPlugins>
