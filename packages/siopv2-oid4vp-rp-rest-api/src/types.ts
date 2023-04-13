import { IAgentContext, ICredentialIssuer, ICredentialVerifier, IDataStoreORM, IDIDManager, IKeyManager, IResolver } from '@veramo/core'
import { ISIOPv2RP } from '@sphereon/ssi-sdk-siopv2-oid4vp-rp-auth'
import { IPresentationExchange } from '@sphereon/ssi-sdk-presentation-exchange'

export type IRequiredContext = IAgentContext<
  IDataStoreORM & IResolver & IDIDManager & IKeyManager & ICredentialIssuer & ICredentialVerifier & ISIOPv2RP & IPresentationExchange
>
