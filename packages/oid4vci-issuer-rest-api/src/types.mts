import { IOID4VCIIssuer } from '@sphereon/ssi-sdk.oid4vci-issuer'
import { IOID4VCIStore } from '@sphereon/ssi-sdk.oid4vci-issuer-store'
import { IAgentContext, ICredentialIssuer, ICredentialVerifier, IDataStore, IDataStoreORM, IDIDManager, IKeyManager, IResolver } from '@veramo/core'

export type IRequiredContext = IAgentContext<IPlugins>

export type IPlugins = IDIDManager &
  IKeyManager &
  IDataStore &
  IDataStoreORM &
  IResolver &
  IOID4VCIStore &
  IOID4VCIIssuer &
  ICredentialVerifier &
  ICredentialIssuer
