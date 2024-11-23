import { com } from '@sphereon/kmp-mdoc-core'
import {
  CertificateInfo,
  getCertificateInfo,
  pemOrDerToX509Certificate,
  X509ValidationResult
} from '@sphereon/ssi-sdk-ext.x509-utils'
import { IAgentPlugin } from '@veramo/core'
import {
  MdocOid4vpPresentArgs,
  MdocOid4VPPresentationAuth,
  MdocOid4vpRPVerifyArgs,
  MdocOid4vpRPVerifyResult,
  schema
} from '..'
import { CoseCryptoService, X509CallbackService } from '../functions'
import {
  GetX509CertificateInfoArgs,
  ImDLMdoc,
  IRequiredContext,
  KeyType,
  MdocVerifyIssuerSignedArgs,
  VerifyCertificateChainArgs
} from '../types/ImDLMdoc'
import CoseSign1Json = com.sphereon.crypto.cose.CoseSign1Json
import CoseJoseKeyMappingService = com.sphereon.crypto.CoseJoseKeyMappingService
import IVerifySignatureResult = com.sphereon.crypto.generic.IVerifySignatureResult
import decodeFrom = com.sphereon.kmp.decodeFrom
import encodeTo = com.sphereon.kmp.encodeTo
import Encoding = com.sphereon.kmp.Encoding
import DeviceResponseCbor = com.sphereon.mdoc.data.device.DeviceResponseCbor
import DocumentCbor = com.sphereon.mdoc.data.device.DocumentCbor
import IOid4VPPresentationDefinition = com.sphereon.mdoc.oid4vp.IOid4VPPresentationDefinition
import Oid4VPPresentationSubmission = com.sphereon.mdoc.oid4vp.Oid4VPPresentationSubmission
import ValidationsJS = com.sphereon.mdoc.ValidationsJS
import CoseCryptoServiceJS = com.sphereon.crypto.CoseCryptoServiceJS

export const mdocSupportMethods: Array<string> = [
  'x509VerifyCertificateChain',
  'x509GetCertificateInfo',
  'mdocVerifyIssuerSigned',
  'mdocOid4vpHolderPresent',
  'mdocOid4vpRPVerify',
]

/**
 * The MDLMdoc class implements the IAgentPlugin interface, providing methods for
 * verification and information retrieval related to X.509 certificates and mDL (mobile
 * driver's license) documents.
 */
export class MDLMdoc implements IAgentPlugin {
  readonly schema = schema.IMDLMdoc
  readonly methods: ImDLMdoc = {
    x509VerifyCertificateChain: this.x509VerifyCertificateChain.bind(this),
    x509GetCertificateInfo: this.x509GetCertificateInfo.bind(this),
    mdocVerifyIssuerSigned: this.mdocVerifyIssuerSigned.bind(this),
    mdocOid4vpHolderPresent: this.mdocOid4vpHolderPresent.bind(this),
    mdocOid4vpRPVerify: this.mdocOid4vpRPVerify.bind(this),
  }
  private readonly trustAnchors: string[]
  private opts: {
    trustRootWhenNoAnchors?: boolean
    allowSingleNoCAChainElement?: boolean
    blindlyTrustedAnchors?: string[]
  }

  constructor(args?: {
    trustAnchors?: string[]
    opts?: {
      // Trust the supplied root from the chain, when no anchors are being passed in.
      trustRootWhenNoAnchors?: boolean
      // Do not perform a chain validation check if the chain only has a single value. This means only the certificate itself will be validated. No chain checks for CA certs will be performed. Only used when the cert has no issuer
      allowSingleNoCAChainElement?: boolean
      // WARNING: Do not use in production
      // Similar to regular trust anchors, but no validation is performed whatsoever. Do not use in production settings! Can be handy with self generated certificates as we perform many validations, making it hard to test with self-signed certs. Only applied in case a chain with 1 element is passed in to really make sure people do not abuse this option
      blindlyTrustedAnchors?: string[]
    }
  }) {
    this.trustAnchors = args?.trustAnchors ?? []
    this.opts = args?.opts ?? { trustRootWhenNoAnchors: true }
  }

  /**
   * Processes and verifies the provided mdoc, generates device response and presentation submission tokens.
   *
   * @param {MdocOid4vpPresentArgs} args - An object containing arguments for mdoc oid4vp holder presentation.
   * @param {IRequiredContext} _context - Required context for the operation.
   * @return {Promise<MdocOid4VPPresentationAuth>} A promise that resolves to an object containing vp_token and presentation_submission.
   */
  private async mdocOid4vpHolderPresent(args: MdocOid4vpPresentArgs, _context: IRequiredContext): Promise<MdocOid4VPPresentationAuth> {
    const { mdocBase64Url, presentationDefinition, trustAnchors, verifications } = args
    const mdoc = DocumentCbor.Static.cborDecode(decodeFrom(mdocBase64Url, Encoding.BASE64URL))
    const validations = await ValidationsJS.fromDocumentAsync(mdoc, null, trustAnchors ?? this.trustAnchors, verifications?.allowExpiredDocuments)
    if (validations.error) {
      return Promise.reject(
        Error(
          `Validation for the MSO_MDOC failed. ${validations.verifications
            .filter((ver) => ver.error)
            .map((ver) => `${ver.name}(critical${ver.critical}): ${ver.message}`)
            .join(',')}`,
        ),
      )
    }
    const deviceResponse = mdoc.toSingleDocDeviceResponse(presentationDefinition as IOid4VPPresentationDefinition)
    const vp_token = encodeTo(deviceResponse.cborEncode(), Encoding.BASE64URL)
    const presentation_submission = Oid4VPPresentationSubmission.Static.fromPresentationDefinition(
      presentationDefinition as IOid4VPPresentationDefinition,
    )
    return { vp_token, presentation_submission }
  }

  /**
   * Verifies the Result Provider (RP) for mdoc (mobile document) OIDC4VP (OpenID Connect for Verifiable Presentations).
   *
   * @param {MdocOid4vpRPVerifyArgs} args - The arguments required for verification, including the vp_token, presentation_submission, and trustAnchors.
   * @param {IRequiredContext} _context - The required context for this method.
   * @return {Promise<MdocOid4vpRPVerifyResult>} - A promise that resolves to an object containing error status,
   * validated documents, and the original presentation submission.
   */
  private async mdocOid4vpRPVerify(args: MdocOid4vpRPVerifyArgs, _context: IRequiredContext): Promise<MdocOid4vpRPVerifyResult> {
    const { vp_token, presentation_submission, trustAnchors } = args
    const deviceResponse = DeviceResponseCbor.Static.cborDecode(decodeFrom(vp_token, Encoding.BASE64URL))
    if (!deviceResponse.documents) {
      return Promise.reject(Error(`No documents found in vp_token`))
    }
    let error = false
    const documents = await Promise.all(
      deviceResponse.documents.map(async (document) => {
        const validations = await ValidationsJS.fromDocumentAsync(document, null, trustAnchors ?? this.trustAnchors)
        if (!validations || validations.error) {
          error = true
        }
        if (presentation_submission.descriptor_map.find((m) => m.id === document.docType.value) === null) {
          error = true
          validations.verifications.push({
            name: 'mdoc',
            error,
            critical: error,
            message: `No descriptor map id with document type ${document.docType.value} present`,
          })
        }
        return { document: document.toJson(), validations }
      }),
    )
    return { error, documents, presentation_submission }
  }

  /**
   * Verifies the issuer-signed Mobile Document (mDoc) using the provided arguments and context.
   *
   * @param {MdocVerifyIssuerSignedArgs} args - The arguments required for verification, including input and key information.
   * @param {IRequiredContext} context - The context encompassing necessary dependencies and configurations.
   * @return {Promise<IVerifySignatureResult<KeyType>>} A promise that resolves to the result of the signature verification, including key information if available.
   */
  private async mdocVerifyIssuerSigned(args: MdocVerifyIssuerSignedArgs, context: IRequiredContext): Promise<IVerifySignatureResult<KeyType>> {
    const { input, keyInfo, requireX5Chain } = args
    const coseKeyInfo = keyInfo && CoseJoseKeyMappingService.toCoseKeyInfo(keyInfo)
    const verification =  await new CoseCryptoServiceJS(new CoseCryptoService()).verify1(CoseSign1Json.Static.fromDTO(input).toCbor(), coseKeyInfo, requireX5Chain )
    return {...verification, keyInfo: keyInfo}
  }

  /**
   * Verifies an X.509 certificate chain against a set of trust anchors.
   *
   * @param {VerifyCertificateChainArgs} args - The arguments required for verifying the certificate chain.
   * This includes the certificate chain to be verified and any additional trust anchors to be used.
   * @param {IRequiredContext} _context - The context required for verification, including necessary dependencies and settings.
   * @return {Promise<X509ValidationResult>} A promise that resolves to the result of the validation process, indicating the success or failure of the certificate chain verification.
   */
  private async x509VerifyCertificateChain(args: VerifyCertificateChainArgs, _context: IRequiredContext): Promise<X509ValidationResult> {
    const mergedAnchors: string[] = [...this.trustAnchors, ...(args.trustAnchors ?? [])]
    const trustAnchors = new Set<string>(mergedAnchors)
    return await new X509CallbackService().verifyCertificateChain({
      ...args,
      trustAnchors: Array.from(trustAnchors),
      opts: args?.opts ?? this.opts,
    })
  }

  /**
   * Extracts information from a list of X509 certificates.
   *
   * @param {GetX509CertificateInfoArgs} args - Arguments required to retrieve certificate information,
   * including the certificates and optional Subject Alternative Name (SAN) type filter.
   * @param {IRequiredContext} context - The context required for the operation, which may include
   * logging, configuration, and other operational details.
   * @return {Promise<CertificateInfo[]>} A promise that resolves with an array of certificate
   * information objects, each containing details extracted from individual certificates.
   */
  private async x509GetCertificateInfo(args: GetX509CertificateInfoArgs, context: IRequiredContext): Promise<CertificateInfo[]> {
    const certificates = args.certificates.map((cert) => pemOrDerToX509Certificate(cert))
    return await Promise.all(certificates.map((cert) => getCertificateInfo(cert, args.sanTypeFilter && { sanTypeFilter: args.sanTypeFilter })))
  }
}
