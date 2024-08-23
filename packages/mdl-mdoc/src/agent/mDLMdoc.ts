import { com } from '@sphereon/kmp-mdl-mdoc'
import { X509ValidationResult } from '@sphereon/ssi-sdk-ext.x509-utils'
import { IAgentPlugin } from '@veramo/core'
import { CoseCryptoService, X509CallbackService } from '../functions'
import {
  ImDLMdoc,
  IRequiredContext,
  KeyType,
  MdocVerifyIssuerSignedArgs,
  VerifyCertificateChainArgs
} from '../types/ImDLMdoc'
import CoseSign1Json = com.sphereon.crypto.cose.CoseSign1Json
import IVerifySignatureResult = com.sphereon.crypto.IVerifySignatureResult
import { schema } from '..'
import ICoseKeyCbor = com.sphereon.crypto.cose.ICoseKeyCbor
import IKeyInfo = com.sphereon.crypto.IKeyInfo

export const mdocSupportMethods: Array<string> = ['verifyCertificateChain', 'mdocVerifyIssuerSigned']

export class MDLMdoc implements IAgentPlugin {
  readonly schema = schema.IMDLMdoc
  readonly methods: ImDLMdoc = {
    verifyCertificateChain: this.verifyCertificateChain.bind(this),
    mdocVerifyIssuerSigned: this.mdocVerifyIssuerSigned.bind(this)
  }
  private trustAnchorsInPEM: string[]


  constructor(args?: { trustAnchorsInPEM?: string[] }) {
    this.trustAnchorsInPEM = args?.trustAnchorsInPEM ?? []
  }

  private async mdocVerifyIssuerSigned(args: MdocVerifyIssuerSignedArgs, context: IRequiredContext): Promise<IVerifySignatureResult<KeyType>> {
    const { input, keyInfo } = args

    // FIXME: The ignore because of json/cbor
    // @ts-ignore
    return await new CoseCryptoService().verify1(CoseSign1Json.Static.fromDTO(input).toCbor(), {
      ...keyInfo,
      key: keyInfo?.key
    } as IKeyInfo<ICoseKeyCbor>) // fixme: Json to Cbor for key
  }

  private async verifyCertificateChain(args: VerifyCertificateChainArgs, _context: IRequiredContext): Promise<X509ValidationResult> {
    const trustAnchors = args.trustAnchors ?? []
    return await new X509CallbackService().verifyCertificateChain({
      ...args,
      trustAnchors: Array.from(new Set(...this.trustAnchorsInPEM, ...trustAnchors))
    })
  }
}
