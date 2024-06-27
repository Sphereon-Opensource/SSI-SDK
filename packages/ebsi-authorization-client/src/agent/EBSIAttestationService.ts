import { OID4VCICredentialFormat, RequestObjectOpts } from '@sphereon/oid4vci-common'
import { IIdentifierOpts } from '@sphereon/ssi-sdk-ext.did-utils'
import { AttestationAuthRequestUrlResult, ebsiCreateAttestationAuthRequestURL } from '../functions'
import { IRequiredContext } from '../types/IEBSIAuthorizationClient'

export class EBSIAttestationService {
  private readonly credentialIssuer: string
  private readonly idOpts: IIdentifierOpts
  private readonly clientId: string

  constructor(args: { credentialIssuer: string; idOpts: IIdentifierOpts; clientId: string }) {
    this.credentialIssuer = args.credentialIssuer
    this.idOpts = args.idOpts
    this.clientId = args.clientId
  }

  createAttestationRequestAuthURL(
    opts: {
      credentialType: string
      requestObjectOpts: RequestObjectOpts
      redirectUri?: string
      formats?: Array<Extract<OID4VCICredentialFormat, 'jwt_vc' | 'jwt_vc_json'>>
    },
    context: IRequiredContext,
  ): Promise<AttestationAuthRequestUrlResult> {
    return ebsiCreateAttestationAuthRequestURL(
      {
        credentialIssuer: this.credentialIssuer,
        idOpts: this.idOpts,
        clientId: this.clientId,
        ...opts,
      },
      context,
    )
  }
}
