import { IAgentPlugin } from '@veramo/core'
import { IIssueRequest, IIssueRequestResponse, IMsVcApiIssuer, IRequiredContext } from '../types/IMsVcApiIssuer'
import { ClientCredentialAuthenticator, checkMsIdentityHostname } from '@sphereon/ms-authenticator'
/**
 * {@inheritDoc IMsVcApiIssuer}
 */
export class MsVcApiIssuer implements IAgentPlugin {
  readonly methods: IMsVcApiIssuer = {
    issuanceRequestMsVc: this.issuanceRequestMsVc.bind(this)
  }

  async fetchIssuanceRequestMs(issuanceInfo: IIssueRequest, accessToken : string, msIdentityHostName: string): Promise<IIssueRequestResponse>{
    var client_api_request_endpoint = `${msIdentityHostName}${issuanceInfo.authenticationInfo.azTenantId}/verifiablecredentials/request`;

    var payload = JSON.stringify(issuanceInfo.issuanceConfig);
    const fetchOptions = {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length.toString(),
        'Authorization': `Bearer ${accessToken}`
      }
    };
    const response = await fetch(client_api_request_endpoint, fetchOptions);
    return await response.json();
  }

  /** {@inheritDoc IMsVcApiIssuer.issuanceRequestMsVc} */
  private async issuanceRequestMsVc(issuanceInfo: IIssueRequest, context: IRequiredContext): Promise<IIssueRequestResponse> {
    console.log('issuanceRequestMsVc is called');
    var accessToken = await ClientCredentialAuthenticator(issuanceInfo.authenticationInfo);
    console.log('accessToken: ' + accessToken)

    var msIdentityHostName = await checkMsIdentityHostname(issuanceInfo.authenticationInfo);
    console.log('msIdentityHostName: ' + msIdentityHostName)

    // Config Request and App Config File should be a parameter to this function
    if (!issuanceInfo.authenticationInfo.azTenantId) {
      throw new Error('azTenantId is missing.')
    }

      // check if pin is required, if found make sure we set a new random pin
      // pincode is only used when the payload contains claim value pairs which results in an IDTokenhint
      if ( issuanceInfo.issuanceConfig.issuance.pin ) {
        issuanceInfo.issuanceConfig.issuance.pin.value = this.generatePin( issuanceInfo.issuanceConfig.issuance.pin.length );
      }
      console.log('issuanceInfo.issuanceConfig.issuance.pin.value: ' + issuanceInfo.issuanceConfig.issuance.pin.value)

    var resp = await this.fetchIssuanceRequestMs(issuanceInfo, accessToken, msIdentityHostName)
    console.log('resp: ' + resp)

    // the response from the VC Request API call is returned to the caller (the UI). It contains the URI to the request which Authenticator can download after
    // it has scanned the QR code. If the payload requested the VC Request service to create the QR code that is returned as well
    // the javascript in the UI will use that QR code to display it on the screen to the user.
    resp.id = issuanceInfo.issuanceConfig.callback.state;                              // add session id so browser can pull status
    if ( issuanceInfo.issuanceConfig.issuance.pin ) {
      resp.pin = issuanceInfo.issuanceConfig.issuance.pin.value;   // add pin code so browser can display it
    }
    return resp
  }

  private generatePin( digits : any) {
    var add = 1, max = 12 - add;
    max        = Math.pow(10, digits+add);
    var min    = max/10; // Math.pow(10, n) basically
    var number = Math.floor( Math.random() * (max - min + 1) ) + min;
    return ("" + number).substring(add);
  }
}
