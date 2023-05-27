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
import { IPresentationExchange } from '@sphereon/ssi-sdk.presentation-exchange'

export type IRequiredPlugins = IDataStore &
  IDataStoreORM &
  IDIDManager &
  IKeyManager &
  ICredentialIssuer &
  ICredentialVerifier &
  IPresentationExchange &
  ICredentialPlugin &
  IResolver
export type IRequiredContext = IAgentContext<IRequiredPlugins>
