import { com } from '@sphereon/kmp-mdl-mdoc'
import { X509ValidationResult } from '@sphereon/ssi-sdk-ext.x509-utils'
import { IAgentContext, IDIDManager, IKeyManager, IPluginMethodMap, IResolver } from '@veramo/core'
import CoseSign1Json = com.sphereon.cbor.cose.CoseSign1Json
import ICoseKeyJson = com.sphereon.cbor.cose.ICoseKeyJson
import IKeyInfo = com.sphereon.crypto.IKeyInfo
import IVerifySignatureResult = com.sphereon.crypto.IVerifySignatureResult

export interface ImDLMdoc extends IPluginMethodMap {
  verifyCertificateChain(args: VerifyCertificateChainArgs, context: IRequiredContext): Promise<X509ValidationResult>
  mdocVerifyIssuerSigned(args: MdocVerifyIssuerSignedArgs, context: IRequiredContext): Promise<IVerifySignatureResult<KeyType>>
}

export type IRequiredContext = IAgentContext<IKeyManager & IDIDManager & IResolver>
export type VerifyCertificateChainArgs = {
  chain: Array<string | Uint8Array>
  trustAnchors?: string[]
  verificationTime?: Date
}

export type KeyType = ICoseKeyJson
export type MdocVerifyIssuerSignedArgs = {
  input: CoseSign1Json<any, any>
  keyInfo?: IKeyInfo<KeyType>
}
