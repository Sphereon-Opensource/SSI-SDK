import {
  IAgentContext,
  ICredentialIssuer,
  ICredentialVerifier,
  IDataStoreORM,
  IDIDManager,
  IKeyManager,
  IResolver,
} from '@veramo/core'
import { ISiopv2RelyingParty } from '@sphereon/ssi-sdk-siopv2-openid4vp-rp-auth'

export type IRequiredContext = IAgentContext<IDataStoreORM & IResolver & IDIDManager & IKeyManager & ICredentialIssuer & ICredentialVerifier & ISiopv2RelyingParty>
