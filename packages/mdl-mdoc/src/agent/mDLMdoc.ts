import { com } from '@sphereon/kmp-mdl-mdoc'
import { CertificateInfo, getCertificateInfo, pemOrDerToX509Certificate, X509ValidationResult } from '@sphereon/ssi-sdk-ext.x509-utils'
import { IAgentPlugin } from '@veramo/core'
import { schema } from '..'
import { CoseCryptoService, X509CallbackService } from '../functions'
import {
  GetX509CertificateInfoArgs,
  ImDLMdoc,
  IRequiredContext,
  KeyType,
  MdocVerifyIssuerSignedArgs,
  VerifyCertificateChainArgs,
} from '../types/ImDLMdoc'
import CoseSign1Json = com.sphereon.crypto.cose.CoseSign1Json
import ICoseKeyCbor = com.sphereon.crypto.cose.ICoseKeyCbor
import IKeyInfo = com.sphereon.crypto.IKeyInfo
import IVerifySignatureResult = com.sphereon.crypto.IVerifySignatureResult

export const mdocSupportMethods: Array<string> = ['verifyCertificateChain', 'mdocVerifyIssuerSigned']

export class MDLMdoc implements IAgentPlugin {
  readonly schema = schema.IMDLMdoc
  readonly methods: ImDLMdoc = {
    x509VerifyCertificateChain: this.x509VerifyCertificateChain.bind(this),
    x509GetCertificateInfo: this.x509GetCertificateInfo.bind(this),
    mdocVerifyIssuerSigned: this.mdocVerifyIssuerSigned.bind(this),
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
      // Similar to regular trust anchors, but no validation is performed whatsover. Do not use in production settings! Can be handy with self generated certificates as we perform many validations, making it hard to test with self-signed certs. Only applied in case a chain with 1 element is passed in to really make sure people do not abuse this option
      blindlyTrustedAnchors?: string[]
    }
  }) {
    this.trustAnchors = args?.trustAnchors ?? []
    this.opts = args?.opts ?? { trustRootWhenNoAnchors: true }
  }

  private async mdocVerifyIssuerSigned(args: MdocVerifyIssuerSignedArgs, context: IRequiredContext): Promise<IVerifySignatureResult<KeyType>> {
    const { input, keyInfo } = args

    // FIXME: The ignore because of json/cbor
    // @ts-ignore
    return await new CoseCryptoService().verify1(CoseSign1Json.Static.fromDTO(input).toCbor(), {
      ...keyInfo,
      key: keyInfo?.key,
    } as IKeyInfo<ICoseKeyCbor>) // fixme: Json to Cbor for key
  }

  private async x509VerifyCertificateChain(args: VerifyCertificateChainArgs, _context: IRequiredContext): Promise<X509ValidationResult> {
    const mergedAnchors: string[] = [...this.trustAnchors, ...(args.trustAnchors ?? [])]
    const trustAnchors = new Set<string>(mergedAnchors)
    return await new X509CallbackService().verifyCertificateChain({
      ...args,
      trustAnchors: Array.from(trustAnchors),
      opts: args?.opts ?? this.opts,
    })
  }

  private async x509GetCertificateInfo(args: GetX509CertificateInfoArgs, context: IRequiredContext): Promise<CertificateInfo[]> {
    const certificates = args.certificates.map((cert) => pemOrDerToX509Certificate(cert))
    return await Promise.all(certificates.map((cert) => getCertificateInfo(cert, args.sanTypeFilter && { sanTypeFilter: args.sanTypeFilter })))
  }
}
