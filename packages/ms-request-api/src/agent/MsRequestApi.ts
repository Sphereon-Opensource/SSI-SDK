import { IAgentPlugin } from '@veramo/core'
import {
  IClientIssueRequest,
  IIssueRequest,
  IIssueRequestResponse,
  IMsRequestApi,
  IRequiredContext,
  Issuance,
  IssuanceConfig,
} from '../types/IMsRequestApi'
import { ClientCredentialAuthenticator, checkMsIdentityHostname } from '@sphereon/ms-authenticator'
import { generatePin, fetchIssuanceRequestMs } from '../IssuerUtil'
/**
 * {@inheritDoc IMsRequestApi}
 */
export class MsRequestApi implements IAgentPlugin {
  readonly methods: IMsRequestApi = {
    issuanceRequestMsVc: this.issuanceRequestMsVc.bind(this),
  }

  /** {@inheritDoc IMsRequestApi.issuanceRequestMsVc} */
  private async issuanceRequestMsVc(clientIssueRequest: IClientIssueRequest, context: IRequiredContext): Promise<IIssueRequestResponse> {
    var accessToken = await ClientCredentialAuthenticator(clientIssueRequest.authenticationInfo)

    var msIdentityHostName = await checkMsIdentityHostname(clientIssueRequest.authenticationInfo)

    // Config Request and App Config File should be a parameter to this function
    if (!clientIssueRequest.authenticationInfo.azTenantId) {
      throw new Error('azTenantId is missing.')
    }

    // check if pin is required, if found make sure we set a new random pin
    // pincode is only used when the payload contains claim value pairs which results in an IDTokenhint
    if (clientIssueRequest.clientIssuanceConfig.issuance.pin) {
      clientIssueRequest.clientIssuanceConfig.issuance.pin.value = generatePin(clientIssueRequest.clientIssuanceConfig.issuance.pin.length)
    }

    var issuance: Issuance = {
      type: clientIssueRequest.clientIssuanceConfig.issuance.type,
      manifest: clientIssueRequest.clientIssuanceConfig.issuance.manifest,
      pin: clientIssueRequest.clientIssuanceConfig.issuance.pin,
      claims: clientIssueRequest.claims,
    }

    var issuanceConfig: IssuanceConfig = {
      authority: clientIssueRequest.clientIssuanceConfig.authority,
      includeQRCode: clientIssueRequest.clientIssuanceConfig.includeQRCode,
      registration: clientIssueRequest.clientIssuanceConfig.registration,
      callback: clientIssueRequest.clientIssuanceConfig.callback,
      issuance: issuance,
    }
    var issueRequest: IIssueRequest = {
      authenticationInfo: clientIssueRequest.authenticationInfo,
      issuanceConfig: issuanceConfig,
    }

    var resp = await fetchIssuanceRequestMs(issueRequest, accessToken, msIdentityHostName)

    // the response from the VC Request API call is returned to the caller (the UI). It contains the URI to the request which Authenticator can download after
    // it has scanned the QR code. If the payload requested the VC Request service to create the QR code that is returned as well
    // the javascript in the UI will use that QR code to display it on the screen to the user.
    resp.id = issueRequest.issuanceConfig.callback.state // add session id so browser can pull status
    if (issueRequest.issuanceConfig.issuance.pin) {
      resp.pin = issueRequest.issuanceConfig.issuance.pin.value // add pin code so browser can display it
    }
    return resp
  }
}
