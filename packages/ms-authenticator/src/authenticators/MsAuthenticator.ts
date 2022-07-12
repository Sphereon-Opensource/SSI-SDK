import { ConfidentialClientApplication, LogLevel, PublicClientApplication, UsernamePasswordRequest } from '@azure/msal-node'
import { IMsAuthenticationClientCredentialArgs, IMsAuthenticationUsernamePasswordArgs } from '../index'
import { fetch } from 'cross-fetch'

const EU = 'EU'

const HTTP_METHOD_GET = 'GET'

// Event though there are many regions, MS has only 2 identity host names (EU and NONE_EU)
// https://docs.microsoft.com/en-us/azure/active-directory/verifiable-credentials/whats-new#are-there-any-changes-to-the-way-that-we-use-the-request-api-as-a-result-of-this-move
export const MS_IDENTITY_HOST_NAME_NONE_EU = 'https://beta.did.msidentity.com/v1.0/'
export const MS_IDENTITY_HOST_NAME_EU = 'https://beta.eu.did.msidentity.com/v1.0/'
const MS_LOGIN_PREFIX = 'https://login.microsoftonline.com/'
const MS_LOGIN_OPENID_CONFIG_POSTFIX = '/v2.0/.well-known/openid-configuration'
const MS_CLIENT_CREDENTIAL_DEFAULT_SCOPE = '3db474b9-6a0c-4840-96ac-1fceb342124f/.default'

const ERROR_CREDENTIAL_MANIFEST_REGION = `Error in config file. CredentialManifest URL configured for wrong tenant region. Should start with:`
const ERROR_ACQUIRE_ACCESS_TOKEN_FOR_CLIENT = 'Could not acquire credentials to access your Azure Key Vault:\n'
const ERROR_FAILED_AUTHENTICATION = 'failed to authenticate: '

async function getClientRegion(azTenantId: string): Promise<string> {
  let region = EU
  await fetch(MS_LOGIN_PREFIX + azTenantId + MS_LOGIN_OPENID_CONFIG_POSTFIX, { method: HTTP_METHOD_GET })
    .then((res) => res.json())
    .then(async (resp) => {
      region = resp.tenant_region_scope
    })
  return region
}

export async function checkMsIdentityHostname(authenticationArgs: IMsAuthenticationClientCredentialArgs): Promise<string> {
  const region = authenticationArgs.region ? authenticationArgs.region : await getClientRegion(authenticationArgs.azTenantId)
  const msIdentityHostName = region === EU ? MS_IDENTITY_HOST_NAME_EU : MS_IDENTITY_HOST_NAME_NONE_EU
  // Check that the Credential Manifest URL is in the same tenant Region and throw an error if it's not
  if (!authenticationArgs.credentialManifestUrl.startsWith(msIdentityHostName)) {
    throw new Error(ERROR_CREDENTIAL_MANIFEST_REGION + msIdentityHostName)
  }
  return msIdentityHostName
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
  const msalConfig = {
    auth: {
      clientId: authenticationArgs.azClientId,
      authority: authenticationArgs.authority ? authenticationArgs.authority : MS_LOGIN_PREFIX + authenticationArgs.azTenantId,
      clientSecret: authenticationArgs.azClientSecret,
    },
    system: {
      loggerOptions: {
        piiLoggingEnabled: authenticationArgs.piiLoggingEnabled ? authenticationArgs.piiLoggingEnabled : false,
        logLevel: authenticationArgs.logLevel ? authenticationArgs.logLevel : LogLevel.Verbose,
      },
    },
  }

  const cca = new ConfidentialClientApplication(msalConfig)
  const msalClientCredentialRequest = {
    scopes: authenticationArgs.scopes ? authenticationArgs.scopes : [MS_CLIENT_CREDENTIAL_DEFAULT_SCOPE],
    skipCache: authenticationArgs.skipCache ? authenticationArgs.skipCache : false,
  }

  checkMsIdentityHostname(authenticationArgs)

  // get the Access Token
  try {
    const result = await cca.acquireTokenByClientCredential(msalClientCredentialRequest)
    if (result && result.accessToken) {
      return result.accessToken
    }
  } catch (err) {
    throw {
      error: ERROR_ACQUIRE_ACCESS_TOKEN_FOR_CLIENT + err,
    }
  }
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
      authority: authenticationArgs.authority ? authenticationArgs.authority : MS_LOGIN_PREFIX + authenticationArgs.azTenantId,
    },
  }
  const pca = new PublicClientApplication(msalConfig)
  return await pca
    .acquireTokenByUsernamePassword(authenticationArgs as UsernamePasswordRequest)
    .then((response: any) => {
      return response
    })
    .catch((error: any) => {
      throw new Error(ERROR_FAILED_AUTHENTICATION + error)
    })
}
