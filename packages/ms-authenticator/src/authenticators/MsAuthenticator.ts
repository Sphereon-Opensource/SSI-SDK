import {
  AuthenticationResult,
  ConfidentialClientApplication,
  Configuration,
  LogLevel,
  NodeAuthOptions,
  PublicClientApplication,
  UsernamePasswordRequest,
} from '@azure/msal-node'
import { fetch } from 'cross-fetch'
import { IMSClientCredentialAuthInfo, IMsAuthenticationClientCredentialArgs, IMsAuthenticationUsernamePasswordArgs } from '../index'

import hash from 'object-hash'

const EU = 'EU'

const HTTP_METHOD_GET = 'GET'

// Event though there are many regions, MS has only 2 DID identity host names (EU and NON_EU)
// https://docs.microsoft.com/en-us/azure/active-directory/verifiable-credentials/whats-new#are-there-any-changes-to-the-way-that-we-use-the-request-api-as-a-result-of-this-move
export const MS_DID_ENDPOINT_NON_EU = 'https://beta.did.msidentity.com/v1.0/'
export const MS_DID_ENDPOINT_EU = 'https://beta.eu.did.msidentity.com/v1.0/'
const MS_LOGIN_PREFIX = 'https://login.microsoftonline.com/'
const MS_LOGIN_OPENID_CONFIG_POSTFIX = '/v2.0/.well-known/openid-configuration'
const MS_CLIENT_CREDENTIAL_DEFAULT_SCOPE = '3db474b9-6a0c-4840-96ac-1fceb342124f/.default'

const ERROR_CREDENTIAL_MANIFEST_REGION = `Error in config file. CredentialManifest URL configured for wrong tenant region. Should start with:`
const ERROR_ACQUIRE_ACCESS_TOKEN_FOR_CLIENT = 'Could not acquire verifiableCredentials to access your Azure Key Vault:\n'
const ERROR_FAILED_AUTHENTICATION = 'failed to authenticate: '

// todo: This is a pretty heavy operation. Getting all the OIDC discovery data from a fetch only to return the region. Probably wise to add some caching and refactor so we can do more with the other OIDC info as well
export async function getMSOpenIDClientRegion(azTenantId: string): Promise<string> {
  return fetch(MS_LOGIN_PREFIX + azTenantId + MS_LOGIN_OPENID_CONFIG_POSTFIX, { method: HTTP_METHOD_GET })
    .then((res) => res.json())
    .then(async (resp) => {
      return resp.tenant_region_scope ?? EU
    })
}

export async function getEntraDIDEndpoint(opts: { region?: string; azTenantId: string }) {
  const region = opts?.region ?? (await getMSOpenIDClientRegion(opts.azTenantId))
  return region === EU ? MS_DID_ENDPOINT_EU : MS_DID_ENDPOINT_NON_EU
}

export async function assertEntraCredentialManifestUrlInCorrectRegion(authenticationArgs: IMsAuthenticationClientCredentialArgs): Promise<string> {
  const msDIDEndpoint = await getEntraDIDEndpoint(authenticationArgs)
  // Check that the Credential Manifest URL is in the same tenant Region and throw an error if it's not
  if (!authenticationArgs.credentialManifestUrl?.startsWith(msDIDEndpoint)) {
    throw new Error(ERROR_CREDENTIAL_MANIFEST_REGION + msDIDEndpoint + `. value: ${authenticationArgs.credentialManifestUrl}`)
  }
  return msDIDEndpoint
}

/**
 * necessary fields are:
 *   azClientId: clientId of the application you're trying to login
 *   azClientSecret: secret of the application you're trying to login
 *   azTenantId: your MS Azure tenantId
 * optional fields:
 *   credentialManifest: address of your credential manifest. usually in following format:
 *    https://beta.eu.did.msidentity.com/v1.0/<tenant_id>/verifiableCredential/contracts/<verifiable_credential_schema>
 * @param authenticationArgs
 * @constructor
 */
export async function getMSClientCredentialAccessToken(
  authenticationArgs: IMsAuthenticationClientCredentialArgs,
  opts?: {
    confidentialClient?: ConfidentialClientApplication
  },
): Promise<AuthenticationResult> {
  const confidentialClient =
    opts?.confidentialClient ?? (await newMSClientCredentialAuthenticator(authenticationArgs).then((cca) => cca.confidentialClient))
  if (!confidentialClient) {
    throw Error('No Credential Client Authenticator could be constructed')
  }
  if (authenticationArgs?.credentialManifestUrl) {
    await assertEntraCredentialManifestUrlInCorrectRegion(authenticationArgs)
  }

  const msalClientCredentialRequest = {
    scopes: authenticationArgs.scopes ?? (authenticationArgs?.credentialManifestUrl ? [MS_CLIENT_CREDENTIAL_DEFAULT_SCOPE] : []),
    skipCache: authenticationArgs.skipCache ?? false,
  }

  // get the Access Token
  try {
    const result = await confidentialClient.acquireTokenByClientCredential(msalClientCredentialRequest)
    if (result) {
      return result
    }
  } catch (err) {
    throw {
      error: ERROR_ACQUIRE_ACCESS_TOKEN_FOR_CLIENT + err,
    }
  }
  throw {
    error: ERROR_ACQUIRE_ACCESS_TOKEN_FOR_CLIENT,
  }
}

export async function newMSClientCredentialAuthenticator(
  authenticationArgs: IMsAuthenticationClientCredentialArgs,
): Promise<IMSClientCredentialAuthInfo> {
  const didEndpoint = authenticationArgs?.credentialManifestUrl
    ? await assertEntraCredentialManifestUrlInCorrectRegion(authenticationArgs)
    : undefined
  const auth = authOptions(authenticationArgs)
  const id = hash(auth)
  const msalConfig: Configuration = {
    auth,
    system: {
      loggerOptions: {
        piiLoggingEnabled: authenticationArgs.piiLoggingEnabled ? authenticationArgs.piiLoggingEnabled : false,
        logLevel: authenticationArgs.logLevel ? authenticationArgs.logLevel : LogLevel.Verbose,
      },
    },
  }
  const confidentialClientApp = new ConfidentialClientApplication(msalConfig)

  return { confidentialClient: confidentialClientApp, msalConfig, authenticationArgs, didEndpoint, id }
}

/**
 * Logs in with provided authenticationArgs and returns access token
 * @param authenticationArgs
 * @constructor
 */
export async function UsernamePasswordAuthenticator(authenticationArgs: IMsAuthenticationUsernamePasswordArgs): Promise<string> {
  const msalConfig = {
    auth: authOptions(authenticationArgs),
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

function authOptions(authenticationArgs: IMsAuthenticationClientCredentialArgs | IMsAuthenticationUsernamePasswordArgs): NodeAuthOptions {
  return {
    clientId: authenticationArgs.azClientId,
    authority: authenticationArgs.authority ? authenticationArgs.authority : MS_LOGIN_PREFIX + authenticationArgs.azTenantId,
    ...(authenticationArgs && 'azClientSecret' in authenticationArgs && { clientSecret: authenticationArgs.azClientSecret }),
  }
}

export function determineMSAuthId(authenticationArgs: IMsAuthenticationClientCredentialArgs | IMsAuthenticationUsernamePasswordArgs): string {
  return hash(authOptions(authenticationArgs))
}
