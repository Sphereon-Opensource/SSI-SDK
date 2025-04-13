import { com } from '@sphereon/kmp-mdoc-core'
import { PresentationDefinitionV2, PresentationSubmission } from '@sphereon/pex-models'
import { ISphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { CertificateInfo, SubjectAlternativeGeneralName, X509ValidationResult } from '@sphereon/ssi-sdk-ext.x509-utils'
import { IAgentContext, IDIDManager, IPluginMethodMap, IResolver } from '@veramo/core'
export type IKey = com.sphereon.crypto.IKey
export type CoseSign1Json = com.sphereon.crypto.cose.CoseSign1Json
export type CoseSign1Cbor<Any> = com.sphereon.crypto.cose.CoseSign1Cbor<Any>
export type ICoseKeyCbor = com.sphereon.crypto.cose.ICoseKeyCbor
export type ICoseKeyJson = com.sphereon.crypto.cose.ICoseKeyJson
export type IKeyInfo<KT extends IKey = IKey> = com.sphereon.crypto.IKeyInfo<KT>
export type IVerifyResults<KT extends IKey> = com.sphereon.crypto.generic.IVerifyResults<KT>
export type IVerifySignatureResult<KT extends IKey> = com.sphereon.crypto.generic.IVerifySignatureResult<KT>
export type DocumentJson = com.sphereon.mdoc.data.device.DocumentJson
export type DocumentCbor = com.sphereon.mdoc.data.device.DocumentCbor
export const CborByteString = com.sphereon.cbor.CborByteString
export const CoseKeyCbor = com.sphereon.crypto.cose.CoseKeyCbor
export const CoseCryptoServiceJS = com.sphereon.crypto.CoseCryptoServiceJS
export const CoseJoseKeyMappingService = com.sphereon.crypto.CoseJoseKeyMappingService
export const KeyInfo = com.sphereon.crypto.KeyInfo
export const DateTimeUtils = com.sphereon.kmp.DateTimeUtils
export const decodeFrom = com.sphereon.kmp.decodeFrom
export const encodeTo = com.sphereon.kmp.encodeTo
export const Encoding = com.sphereon.kmp.Encoding
export const MdocValidations = com.sphereon.mdoc.data.MdocValidations
export const MdocOid4vpService = com.sphereon.mdoc.oid4vp.MdocOid4vpServiceJs
export const Jwk = com.sphereon.crypto.jose.Jwk
export type DocumentDescriptorMatchResult = com.sphereon.mdoc.oid4vp.DocumentDescriptorMatchResult
export type IOid4VPPresentationDefinition = com.sphereon.mdoc.oid4vp.IOid4VPPresentationDefinition
export const Oid4VPPresentationSubmission = com.sphereon.mdoc.oid4vp.Oid4VPPresentationSubmission


export interface ImDLMdoc extends IPluginMethodMap {
  // TODO: Extract cert methods to its own plugin
  x509VerifyCertificateChain(args: VerifyCertificateChainArgs, context: IRequiredContext): Promise<X509ValidationResult>

  x509GetCertificateInfo(args: GetX509CertificateInfoArgs, context: IRequiredContext): Promise<CertificateInfo[]>

  mdocVerifyIssuerSigned(args: MdocVerifyIssuerSignedArgs, context: IRequiredContext): Promise<IVerifySignatureResult<KeyType>>

  mdocOid4vpHolderPresent(args: MdocOid4vpPresentArgs, context: IRequiredContext): Promise<MdocOid4VPPresentationAuth>

  mdocOid4vpRPVerify(args: MdocOid4vpRPVerifyArgs, _context: IRequiredContext): Promise<MdocOid4vpRPVerifyResult>
}

export type IRequiredContext = IAgentContext<ISphereonKeyManager & IDIDManager & IResolver>
export type VerifyCertificateChainArgs = {
  chain: Array<string | Uint8Array>
  trustAnchors?: string[]
  verificationTime?: Date
  opts?: {
    // If no trust anchor is found, but the chain itself checks out, allow. (defaults to false:)
    allowNoTrustAnchorsFound?: boolean
    // Trust the supplied root from the chain, when no anchors are being passed in.
    trustRootWhenNoAnchors?: boolean
    // Do not perform a chain validation check if the chain only has a single value. This means only the certificate itself will be validated. No chain checks for CA certs will be performed. Only used when the cert has no issuer
    allowSingleNoCAChainElement?: boolean
    // WARNING: Do not use in production
    // Similar to regular trust anchors, but no validation is performed whatsover. Do not use in production settings! Can be handy with self generated certificates as we perform many validations, making it hard to test with self-signed certs. Only applied in case a chain with 1 element is passed in to really make sure people do not abuse this option
    blindlyTrustedAnchors?: string[]
  }
}

export type GetX509CertificateInfoArgs = {
  certificates: (string | Uint8Array)[] // pem or der
  sanTypeFilter?: SubjectAlternativeGeneralName | SubjectAlternativeGeneralName[]
}

export type KeyType = ICoseKeyJson
export type MdocVerifyIssuerSignedArgs = {
  input: CoseSign1Json
  keyInfo?: IKeyInfo<KeyType>
  requireX5Chain?: boolean
}

export interface MdocOid4VPPresentationAuth {
  vp_token: string
  presentation_submission: PresentationSubmission
}

export interface MdocOid4vpPresentArgs {
  mdocs: DocumentCbor[]
  mdocHolderNonce?: string
  presentationDefinition: PresentationDefinitionV2
  trustAnchors?: string[]
  verifications?: VerificationOptions
  clientId: string
  responseUri: string
  authorizationRequestNonce: string
}

export type VerificationOptions = {
  allowExpiredDocuments?: boolean
  verificationTime?: Date
}

export type DocumentVerifyResult = { document: DocumentJson; validations: IVerifyResults<ICoseKeyCbor> }
export type MdocOid4vpRPVerifyResult = { error: boolean; documents: Array<DocumentVerifyResult>; presentation_submission: PresentationSubmission }

export interface MdocOid4vpRPVerifyArgs {
  vp_token: string
  presentation_submission: PresentationSubmission
  trustAnchors?: string[]
}
