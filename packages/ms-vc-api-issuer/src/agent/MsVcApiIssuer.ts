import { IAgentPlugin } from '@veramo/core'
import { LogLevel, ConfidentialClientApplication } from '@azure/msal-node'
import { schema } from '../index'
import { IMsAuthenticationArgs, IIssueRequestResponse, IMsAuthenticationResponse, IMsVcApiIssuer, IRequiredContext } from '../types/IMsVcApiIssuer'
import { v4 as uuidv4 } from 'uuid'

/**
 * {@inheritDoc IMsVcApiIssuer}
 */
export class MsVcApiIssuer implements IAgentPlugin {
  readonly schema = schema.IVcApiIssuer
  readonly methods: IMsVcApiIssuer = {
    authenticateMsVcApi: this.authenticateMsVcApi.bind(this),
    issuanceRequestMsVc: this.issuanceRequestMsVc.bind(this)
  }
  private readonly azClientId: string
  private readonly azClientSecret: string
  private readonly azTenantId: string
  private readonly credentialManifest: string
  private msIdentityHostName = ''

  constructor(options: IMsAuthenticationArgs) {
    this.azClientId = options.azClientId
    this.azClientSecret = options.azClientSecret
    this.azTenantId = options.azTenantId
    this.credentialManifest = options.credentialManifest
  }

  /** {@inheritDoc IMsVcApiIssuer.issuanceRequestMsVc} */
  private async issuanceRequestMsVc(args: IMsAuthenticationArgs, context: IRequiredContext): Promise<IIssueRequestResponse> {
    var accessToken = await this.authenticateMsVcApi(args, context);    
    var configFile = '../../config/config.json';
    var config = require( configFile );
    var requestConfigFile = '../../config/issuance_request_config.json';
    var issuanceConfig = require( requestConfigFile );

    // Config Request and App Config File should be a parameter to this function
    if (!config.azTenantId) {
      throw new Error('The config.json file is missing.')
    }

    issuanceConfig.registration.clientName = "Sphereon Node.js SDK API Issuer";

    // modify the callback method to make it easier to debug
    // with tools like ngrok since the URI changes all the time
    // this way you don't need to modify the callback URL in the payload every time
    // ngrok changes the URI
    issuanceConfig.callback.url = `https://6270-2a02-a458-e71a-1-68b4-31d2-b44f-12b.eu.ngrok.io/api/issuer/issuance-request-callback`;
    // modify payload with new state, the state is used to be able to update the UI when callbacks are received from the VC Service
    var id = uuidv4();
    issuanceConfig.callback.state = id;
    // check if pin is required, if found make sure we set a new random pin
    // pincode is only used when the payload contains claim value pairs which results in an IDTokenhint
    if ( issuanceConfig.issuance.pin ) {
      issuanceConfig.issuance.pin.value = this.generatePin( issuanceConfig.issuance.pin.length );
    }

    // here you could change the payload manifest and change the firstname and lastname
    if ( issuanceConfig.issuance.claims ) {
      issuanceConfig.issuance.claims.given_name = "Megan";
      issuanceConfig.issuance.claims.family_name = "Bowen";
    }
    var client_api_request_endpoint = this.msIdentityHostName + `${config.azTenantId}/verifiablecredentials/request`;

    var payload = JSON.stringify(issuanceConfig);
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
    if ( issuanceConfig.issuance.pin ) {
      resp.pin = issuanceConfig.issuance.pin.value;   // add pin code so browser can display it
    }
    console.log( resp );
    return resp
//    resp.status(200).json(resp);
  }

  /** {@inheritDoc IMsVcApiIssuer.authenticateMsVcApi} */
  private async authenticateMsVcApi(args: IMsAuthenticationArgs, context: IRequiredContext): Promise<IMsAuthenticationResponse> {
    var msalConfig = {
      auth: {
        clientId: this.azClientId,
        authority: 'https://login.microsoftonline.com/' + this.azTenantId,
        clientSecret: this.azClientSecret,
      },
      system: {
        loggerOptions: {
          loggerCallback(loglevel: any, message: any, containsPii: any) {
            console.log(message);
          },
          piiLoggingEnabled: false,
          logLevel: LogLevel.Verbose,
        }
      }
    };

    const cca = new ConfidentialClientApplication(msalConfig);
    const msalClientCredentialRequest = {
      scopes: ["3db474b9-6a0c-4840-96ac-1fceb342124f/.default"],
      skipCache: false,
    };

    var accessToken = "";

    await fetch('https://login.microsoftonline.com/' + this.azTenantId + '/v2.0/.well-known/openid-configuration', { method: 'GET' })
      .then(res => res.json())
      .then(async (resp) => {
        this.msIdentityHostName = "https://beta.did.msidentity.com/v1.0/";
        if (resp.tenant_region_scope == "EU") {
          this.msIdentityHostName = "https://beta.eu.did.msidentity.com/v1.0/";
        }
        // Check that the Credential Manifest URL is in the same tenant Region and throw an error if it's not
        if (!this.credentialManifest.startsWith(this.msIdentityHostName)) {
          throw new Error(`Error in config file. CredentialManifest URL configured for wrong tenant region. Should start with:` + this.msIdentityHostName);
        }


        // get the Access Token
        try {
          const result = await cca.acquireTokenByClientCredential(msalClientCredentialRequest);
          if (result) {
            accessToken = result.accessToken;
          }
        } catch {
          console.log("failed to get access token");
          resp.status(401).json({
            'error': 'Could not acquire credentials to access your Azure Key Vault'
          });
          return;
        }
      });
      return accessToken as IMsAuthenticationResponse;
  }

  private generatePin( digits : any) {
    var add = 1, max = 12 - add;
    max        = Math.pow(10, digits+add);
    var min    = max/10; // Math.pow(10, n) basically
    var number = Math.floor( Math.random() * (max - min + 1) ) + min;
    return ("" + number).substring(add);
  }
}
