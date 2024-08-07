import { X509ValidationResult } from '@sphereon/ssi-sdk-ext.x509-utils/src/x509/x509-validator'
import { IAgentContext, IDIDManager, IKeyManager, IPluginMethodMap, IResolver } from '@veramo/core'


export interface ImDLMdoc extends IPluginMethodMap {

  verifyCertificateChain(args: VerifyCertificateChainArgs, context: IRequiredContext): Promise<X509ValidationResult>
  mdocVerifyIssuerSigned(args: any, context: IRequiredContext): Promise<X509ValidationResult>
}

export type IRequiredContext = IAgentContext<IKeyManager & IDIDManager & IResolver>
export type VerifyCertificateChainArgs = {
  chain: Array<string | Uint8Array>,
  trustAnchors?: string[],
  verificationTime?: Date
}
