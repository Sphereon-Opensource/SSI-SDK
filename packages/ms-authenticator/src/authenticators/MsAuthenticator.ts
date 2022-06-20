import { ConfidentialClientApplication, LogLevel, PublicClientApplication, UsernamePasswordRequest } from '@azure/msal-node'
import {
  IMsAuthenticationAuthorizationCodeArgs,
  IMsAuthenticationClientCredentialArgs,
  IMsAuthenticationOnBehalfOfArgs, IMsAuthenticationSilentFlowArgs,
  IMsAuthenticationUsernamePasswordArgs,
} from '../index'

import { fetch } from 'cross-fetch'

/**
 * Not implemented yet
 * @param authenticationArgs
 * @constructor
 */
export async function AuthorizationCodeAuthenticator(authenticationArgs: IMsAuthenticationAuthorizationCodeArgs): Promise<string> {
  throw new Error("This authentication method is not implemented yet.")
}

/**
 * Not implemented yet
 * @param authenticationArgs
 * @constructor
 */
export async function BehalfOfAuthenticator(authenticationArgs: IMsAuthenticationOnBehalfOfArgs): Promise<string> {
  throw new Error("This authentication method is not implemented yet.")
}

/**
 * necessary fields are:
 *   azClientId: clientId of the application you're trying to login
 *   azClientSecret: secret of the application you're trying to login
 *   azTenantId: your MS Azure tenantId
 *   credentialManifest: address of your credential manifest. usually in following format:
 *    https://beta.eu.did.msidentity.com/v1.0/<tenant_id>/verifiableCredential/contracts/<verifiable_credential_schema>
 * @param authenticationArgs
 * @constructor
 */
export async function ClientCredentialAuthenticator(authenticationArgs: IMsAuthenticationClientCredentialArgs): Promise<string> {
  var msalConfig = {
    auth: {
      clientId: authenticationArgs.azClientId,
      authority: 'https://login.microsoftonline.com/' + authenticationArgs.azTenantId,
      clientSecret: authenticationArgs.azClientSecret,
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
  await fetch('https://login.microsoftonline.com/' + authenticationArgs.azTenantId + '/v2.0/.well-known/openid-configuration', {method: 'GET'})
  .then((res) => res.json())
  .then(async (resp) => {
    console.log(`tenant_region_scope = ${resp.tenant_region_scope}`)
    let msIdentityHostName = 'https://beta.did.msidentity.com/v1.0/'
    if (resp.tenant_region_scope == 'EU') {
      msIdentityHostName = 'https://beta.eu.did.msidentity.com/v1.0/'
    }
    // Check that the Credential Manifest URL is in the same tenant Region and throw an error if it's not
    if (!authenticationArgs.credentialManifest.startsWith(msIdentityHostName)) {
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

/**
 * Not implemented yet
 * @param authenticationArgs
 * @constructor
 */
export async function SilentFlowAuthenticator(authenticationArgs: IMsAuthenticationSilentFlowArgs): Promise<string> {
  throw new Error("This authentication method is not implemented yet.")
}

/**
 * necessary fields are:
 *   azClientId: clientId of the application you're trying to login
 *   azTenantId: your MS Azure tenantId
 *   username: username of the user
 *   password: password of the user
 *   scopes: scopes that you want to access via this authentication
 * @param authenticationArgs
 * @constructor
 */
export async function UsernamePasswordAuthenticator(authenticationArgs: IMsAuthenticationUsernamePasswordArgs): Promise<string> {
  const msalConfig = {
    auth: {
      clientId: authenticationArgs.azClientId,
      authority: 'https://login.microsoftonline.com/' + authenticationArgs.azTenantId,
    },
  }
  const pca = new PublicClientApplication(msalConfig)
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
