import { ConfidentialClientApplication, Configuration, LogLevel } from '@azure/msal-node'
/**
 *   azClientId: clientId of the application you're trying to login
 *   azClientSecret: secret of the application you're trying to login
 *   azTenantId: your MS Azure tenantId
 *   credentialManifestUrl: url of your credential manifest. usually in following format:
 *    https://beta.eu.did.msidentity.com/v1.0/<tenant_id>/verifiableCredential/contracts/<verifiable_credential_schema>
 *   authority: optional. if not provided, we'll use the azClientId to create the Tenanted format if provided should be one of these two formats:
 *    - Tenanted: https://login.microsoftonline.com/{tenant}/, where {tenant} is either the GUID representing the tenant ID or a domain name associated with the tenant.
 *    - Work and school accounts: https://login.microsoftonline.com/organizations/.
 *   region?: if present will use the provided, if not will make a request to determine the region
 *   scopes?: scopes that you want to access via this authentication
 *   skipCache?: whether to skip cache
 *   piiLoggingEnabled?: if not provided defaults to false
 *   logLevel?: can be one of these values:
 *     Error = 0,
 *     Warning = 1,
 *     Info = 2,
 *     Verbose = 3,
 *     Trace = 4
 *     if not provided defaults to LogLevel.Verbose
 */
export interface IMsAuthenticationClientCredentialArgs {
  azClientId: string
  azTenantId: string
  azClientSecret: string
  credentialManifestUrl?: string
  authority?: string
  region?: string
  scopes?: string[]
  skipCache?: boolean
  piiLoggingEnabled?: boolean
  logLevel?: LogLevel
}

/**
 *   azClientId: clientId of the application you're trying to login
 *   azTenantId: your MS Azure tenantId
 *   username: username of the user
 *   password: password of the user
 *   scopes: scopes that you want to access via this authentication
 *   authority: optional. if not provided, we'll use the azClientId to create the Tenanted format if provided should be one of these two formats:
 *    - Tenanted: https://login.microsoftonline.com/{tenant}/, where {tenant} is either the GUID representing the tenant ID or a domain name associated with the tenant.
 *    - Work and school accounts: https://login.microsoftonline.com/organizations/.
 */
export interface IMsAuthenticationUsernamePasswordArgs {
  azClientId: string
  azTenantId: string
  password: string
  scopes: string[]
  username: string
  authority?: string
}

export interface IMSClientCredentialAuthInfo {
  id: string
  confidentialClient: ConfidentialClientApplication
  msalConfig: Configuration
  authenticationArgs: IMsAuthenticationClientCredentialArgs
  didEndpoint?: string
}
