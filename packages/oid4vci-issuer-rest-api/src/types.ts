import { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { IOID4VCIIssuer } from '@sphereon/ssi-sdk.oid4vci-issuer'
import { IOID4VCIStore } from '@sphereon/ssi-sdk.oid4vci-issuer-store'
import { IAgentContext, ICredentialIssuer, ICredentialVerifier, IDIDManager, IKeyManager, IResolver } from '@veramo/core'

export type IRequiredContext = IAgentContext<IPlugins>

export type IPlugins = IDIDManager &
  IKeyManager &
  IResolver &
  IIdentifierResolution &
  IOID4VCIStore &
  IOID4VCIIssuer &
  ICredentialVerifier &
  ICredentialIssuer
