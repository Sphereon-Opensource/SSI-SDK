import { X509ValidationResult } from '@sphereon/ssi-sdk-ext.x509-utils/src/x509/x509-validator'
import { IAgentPlugin } from '@veramo/core'
import { X509CallbackService } from '../functions'
import { IRequiredContext, schema, VerifyCertificateChainArgs } from '../index'
import { ImDLMdoc } from '../types/ImDLMdoc'

export const mdocSupportMethods: Array<string> = [
  'mdocVerifyIssuerSigned'
]

export class MDLMdoc implements IAgentPlugin {
  readonly schema = schema.IMDLMdoc
  readonly methods: ImDLMdoc = {
    verifyCertificateChain: this.verifyCertificateChain.bind(this),
    mdocVerifyIssuerSigned: this.mdocVerifyIssuerSigned.bind(this)
  }

  private async mdocVerifyIssuerSigned(args: any, context: IRequiredContext): Promise<any> {

  }

  private async verifyCertificateChain(args: VerifyCertificateChainArgs, _context: IRequiredContext): Promise<X509ValidationResult> {
    return await new X509CallbackService().verifyCertificateChain(args)
  }


}
