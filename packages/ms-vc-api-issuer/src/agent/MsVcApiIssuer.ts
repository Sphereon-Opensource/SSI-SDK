import { IAgentPlugin } from '@veramo/core'
import { IIssueRequest, IIssueRequestResponse, IMsVcApiIssuer, IRequiredContext } from '../types/IMsVcApiIssuer'
import { v4 as uuidv4 } from 'uuid'
import { ClientCredentialAuthenticator} from '@sphereon/ms-authenticator'
/**
 * {@inheritDoc IMsVcApiIssuer}
 */
export class MsVcApiIssuer implements IAgentPlugin {
  readonly methods: IMsVcApiIssuer = {
    issuanceRequestMsVc: this.issuanceRequestMsVc.bind(this)
  }

  private msIdentityHostName = ''

  /** {@inheritDoc IMsVcApiIssuer.issuanceRequestMsVc} */
  private async issuanceRequestMsVc(issuanceInfo: IIssueRequest, context: IRequiredContext): Promise<IIssueRequestResponse> {
    var accessToken = await ClientCredentialAuthenticator(issuanceInfo.authenticationInfo);
    await fetch('https://login.microsoftonline.com/${issuanceInfo.authenticationInfo.azTenantId}/v2.0/.well-known/openid-configuration', { method: 'GET' })
      .then(res => res.json())
      .then(async (resp) => {
        this.msIdentityHostName = "https://beta.did.msidentity.com/v1.0/";
        if (resp.tenant_region_scope == "EU") {
          this.msIdentityHostName = "https://beta.eu.did.msidentity.com/v1.0/";
        }
        // Check that the Credential Manifest URL is in the same tenant Region and throw an error if it's not
        if (!issuanceInfo.authenticationInfo.credentialManifestUrl.startsWith(this.msIdentityHostName)) {
          throw new Error(`Error in config file. CredentialManifest URL configured for wrong tenant region. Should start with:${this.msIdentityHostName}`);
        }
      });

    // Config Request and App Config File should be a parameter to this function
    if (!issuanceInfo.authenticationInfo.azTenantId) {
      throw new Error('The config.json file is missing.')
    }

    issuanceInfo.issuanceConfig.registration.clientName = "Sphereon Node.js SDK API Issuer";

    // modify the callback method to make it easier to debug
    // with tools like ngrok since the URI changes all the time
    // this way you don't need to modify the callback URL in the payload every time
    // ngrok changes the URI
    issuanceInfo.issuanceConfig.callback.url = `https://6270-2a02-a458-e71a-1-68b4-31d2-b44f-12b.eu.ngrok.io/api/issuer/issuance-request-callback`;
    // modify payload with new state, the state is used to be able to update the UI when callbacks are received from the VC Service
    var id = uuidv4();
    issuanceInfo.issuanceConfig.callback.state = id;
    // check if pin is required, if found make sure we set a new random pin
    // pincode is only used when the payload contains claim value pairs which results in an IDTokenhint
    if ( issuanceInfo.issuanceConfig.issuance.pin ) {
      issuanceInfo.issuanceConfig.issuance.pin.value = this.generatePin( issuanceInfo.issuanceConfig.issuance.pin.length );
    }

    // here you could change the payload manifest and change the firstname and lastname
    issuanceInfo.issuanceConfig.issuance.claims ={
      "given_name":"FIRSTNAME",
      "family_name":"LASTNAME"
   }

    var client_api_request_endpoint = this.msIdentityHostName + `${issuanceInfo.authenticationInfo.azTenantId}/verifiablecredentials/request`;

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
    var resp = await response.json()
    // the response from the VC Request API call is returned to the caller (the UI). It contains the URI to the request which Authenticator can download after
    // it has scanned the QR code. If the payload requested the VC Request service to create the QR code that is returned as well
    // the javascript in the UI will use that QR code to display it on the screen to the user.
    resp.id = id;                              // add session id so browser can pull status
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
