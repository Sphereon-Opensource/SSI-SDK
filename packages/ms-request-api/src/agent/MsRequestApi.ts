import { IAgentPlugin } from '@veramo/core'
import { IIssueRequest, IIssueRequestResponse, IMsRequestApi, IRequiredContext } from '../types/IMsRequestApi'
import { ClientCredentialAuthenticator, checkMsIdentityHostname } from '@sphereon/ms-authenticator'
import { generatePin } from '../IssuerUtil';
/**
 * {@inheritDoc IMsRequestApi}
 */
export class MsRequestApi implements IAgentPlugin {
  readonly methods: IMsRequestApi = {
    issuanceRequestMsVc: this.issuanceRequestMsVc.bind(this)
  }


  /** {@inheritDoc IMsRequestApi.issuanceRequestMsVc} */
  private async issuanceRequestMsVc(issuanceInfo: IIssueRequest, fetchFunction: Function, context: IRequiredContext): Promise<IIssueRequestResponse> {
    var accessToken = await ClientCredentialAuthenticator(issuanceInfo.authenticationInfo);

    var msIdentityHostName = await checkMsIdentityHostname(issuanceInfo.authenticationInfo);

    // Config Request and App Config File should be a parameter to this function
    if (!issuanceInfo.authenticationInfo.azTenantId) {
      throw new Error('azTenantId is missing.')
    }

    // check if pin is required, if found make sure we set a new random pin
    // pincode is only used when the payload contains claim value pairs which results in an IDTokenhint
    if (issuanceInfo.issuanceConfig.issuance.pin) {
      issuanceInfo.issuanceConfig.issuance.pin.value = generatePin(issuanceInfo.issuanceConfig.issuance.pin.length);
    }

    var resp = await fetchFunction(issuanceInfo, accessToken, msIdentityHostName)

    // the response from the VC Request API call is returned to the caller (the UI). It contains the URI to the request which Authenticator can download after
    // it has scanned the QR code. If the payload requested the VC Request service to create the QR code that is returned as well
    // the javascript in the UI will use that QR code to display it on the screen to the user.
    resp.id = issuanceInfo.issuanceConfig.callback.state;                              // add session id so browser can pull status
    if (issuanceInfo.issuanceConfig.issuance.pin) {
      resp.pin = issuanceInfo.issuanceConfig.issuance.pin.value;   // add pin code so browser can display it
    }
    return resp
  }

}
