import { ConfidentialClientApplication, LogLevel, PublicClientApplication, UsernamePasswordRequest } from '@azure/msal-node'
import { IMsAuthenticationClientCredentialArgs, IMsAuthenticationUsernamePasswordArgs } from '../index'

import { fetch } from 'cross-fetch'

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
  const msalConfig = {
    auth: {
      clientId: authenticationArgs.azClientId,
      authority: authenticationArgs.authority ? authenticationArgs.authority : 'https://login.microsoftonline.com/' + authenticationArgs.azTenantId,
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
    scopes: authenticationArgs.scopes ? authenticationArgs.scopes : ['3db474b9-6a0c-4840-96ac-1fceb342124f/.default'],
    skipCache: authenticationArgs.skipCache ? authenticationArgs.skipCache : false
  }
  await fetch('https://login.microsoftonline.com/' + authenticationArgs.azTenantId + '/v2.0/.well-known/openid-configuration', {method: 'GET'})
  .then((res) => res.json())
  .then(async (resp) => {
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
      if (result && result.accessToken) {
        return result.accessToken
      }
    } catch {
      throw {
        error: 'Could not acquire credentials to access your Azure Key Vault:\n' + JSON.stringify(resp),
      }
    }
    return ''
  })
  return ''
}

/**
 * Logs in with provided authenticationArgs and returns access token
 * @param authenticationArgs
 * @constructor
 */
export async function UsernamePasswordAuthenticator(authenticationArgs: IMsAuthenticationUsernamePasswordArgs): Promise<string> {
  const msalConfig = {
    auth: {
      clientId: authenticationArgs.azClientId,
      authority: authenticationArgs.authority ? authenticationArgs.authority : 'https://login.microsoftonline.com/' + authenticationArgs.azTenantId,
    },
  }
  const pca = new PublicClientApplication(msalConfig)
  return await pca
  .acquireTokenByUsernamePassword(authenticationArgs as UsernamePasswordRequest)
  .then((response: any) => {
    return response
  })
  .catch((error: any) => {
    throw new Error("failed to authenticate: " + error)
  })
}
