import { IAgentPlugin } from '@veramo/core'
import { LogLevel, ConfidentialClientApplication } from '@azure/msal-node'
import { schema } from '../index'
import { IMsAuthenticationArgs, IMsVcApiIssuer, IRequiredContext } from '../types/IMsVcApiIssuer'

import { fetch } from 'cross-fetch'

/**
 * {@inheritDoc IMsVcApiIssuer}
 */
export class MsVcApiIssuer implements IAgentPlugin {
  readonly schema = schema.IVcApiIssuer
  readonly methods: IMsVcApiIssuer = {
    authenticateMsVcApi: this.authenticateMsVcApi.bind(this),
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

  /** {@inheritDoc IMsVcApiIssuer.authenticateMsVcApi} */
  private async authenticateMsVcApi(args: IMsAuthenticationArgs, context: IRequiredContext): Promise<String> {
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
        console.log(`tenant_region_scope = ${resp.tenant_region_scope}`);
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
        console.log(`accessToken: ${accessToken}`);
      });
      return accessToken;
  }
}
