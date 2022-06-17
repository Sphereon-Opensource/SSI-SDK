import { IAgentPlugin } from '@veramo/core'
import { ConfidentialClientApplication, LogLevel, PublicClientApplication, UsernamePasswordRequest } from '@azure/msal-node'
import {
  IMsAuthenticationAuthorizationCodeArgs,
  IMsAuthenticationClientCredentialArgs,
  IMsAuthenticationOnBehalfOfArgs,
  IMsAuthenticationUsernamePasswordArgs,
  MsAuthenticationTypeEnum,
  schema,
} from '../index'
import { IMsAuthenticationResponse, IMsAuthenticationWrapperArgs, IMsVcApiIssuer } from '../types/IMsVcApiIssuer'

/**
 * {@inheritDoc IMsVcApiIssuer}
 */
export class MsVcApiIssuer implements IAgentPlugin {
  readonly schema = schema.IVcApiIssuer
  readonly methods: IMsVcApiIssuer = {
    authenticateMsVcApi: this.authenticateMsVcApi.bind(this),
  }
  private readonly authenticationType: MsAuthenticationTypeEnum
  private readonly authenticationArgs:
    | IMsAuthenticationClientCredentialArgs
    | IMsAuthenticationUsernamePasswordArgs
    | IMsAuthenticationAuthorizationCodeArgs
    | IMsAuthenticationOnBehalfOfArgs

  constructor(options: IMsAuthenticationWrapperArgs) {
    this.authenticationType = options.authenticationType
    this.authenticationArgs = options.authenticationArgs
  }

  /** {@inheritDoc IMsVcApiIssuer.authenticateMsVcApi} */
  public async authenticateMsVcApi(): Promise<IMsAuthenticationResponse> {
    let accessToken = ''
    console.log('authenticationType:',this.authenticationType, 'authenticationArgs:',this.authenticationArgs)
    /*this.authenticationType = args.authenticationType
    this.authenticationArgs = args.authenticationArgs*/
    if (this.authenticationType === 'ClientCredential') {
      accessToken = await this.authenticateWithClientCredential(this.authenticationArgs as IMsAuthenticationClientCredentialArgs)
    } else if (this.authenticationType === 'UsernamePassword') {
      accessToken = await this.authenticateWithUsernamePassword(this.authenticationArgs as IMsAuthenticationUsernamePasswordArgs)
    } else {
      throw new Error(`method of authentication ${this.authenticationType} is not supported!`)
    }
    return accessToken as IMsAuthenticationResponse
  }

  private async authenticateWithClientCredential(authneticationArgs: IMsAuthenticationClientCredentialArgs) {
    var msalConfig = {
      auth: {
        clientId: authneticationArgs.azClientId,
        authority: 'https://login.microsoftonline.com/' + authneticationArgs.azTenantId,
        clientSecret: authneticationArgs.azClientSecret,
      },
      system: {
        loggerOptions: {
          piiLoggingEnabled: false,
          logLevel: LogLevel.Verbose,
        }
      }
    }

    const cca = new ConfidentialClientApplication(msalConfig)
    const msalClientCredentialRequest = {
      scopes: ['3db474b9-6a0c-4840-96ac-1fceb342124f/.default'],
      skipCache: false,
    }
    await fetch('https://login.microsoftonline.com/' + authneticationArgs.azTenantId + '/v2.0/.well-known/openid-configuration', { method: 'GET' })
      .then((res) => res.json())
      .then(async (resp) => {
        console.log(`tenant_region_scope = ${resp.tenant_region_scope}`)
        let msIdentityHostName = 'https://beta.did.msidentity.com/v1.0/'
        if (resp.tenant_region_scope == 'EU') {
          msIdentityHostName = 'https://beta.eu.did.msidentity.com/v1.0/'
        }
        // Check that the Credential Manifest URL is in the same tenant Region and throw an error if it's not
        if (!authneticationArgs.credentialManifest.startsWith(msIdentityHostName)) {
          throw new Error(`Error in config file. CredentialManifest URL configured for wrong tenant region. Should start with:` + msIdentityHostName)
        }

        // get the Access Token
        try {
          const result = await cca.acquireTokenByClientCredential(msalClientCredentialRequest)
          if (result) {
            return result.accessToken
          }
        } catch {
          console.log('failed to get access token')
          resp.status(401).json({
            error: 'Could not acquire credentials to access your Azure Key Vault',
          })
          return
        }
        return ''
      })
    return ''
  }

  private async authenticateWithUsernamePassword(authenticationArgs: IMsAuthenticationUsernamePasswordArgs) {
    const msalConfig = {
      auth: {
        clientId: authenticationArgs.azClientId,
        authority: 'https://login.microsoftonline.com/' + authenticationArgs.azTenantId,
      },
    }
    const pca = new PublicClientApplication(msalConfig)
    //TODO(sksadjad): see if it's necessary need to fill in the scopes here
    return await pca
      .acquireTokenByUsernamePassword(authenticationArgs as UsernamePasswordRequest)
      .then((response: any) => {
        console.log('acquired token by password grant', response)
        return response
      })
      .catch((error: any) => {
        console.log(error)
      })
  }
}
