import { IAgentContext } from '@veramo/core'

/**
 *   azClientId: clientId of the application you're trying to login
 *   azClientSecret: secret of the application you're trying to login
 *   azTenantId: your MS Azure tenantId
 *   credentialManifestUrl: url of your credential manifest. usually in following format:
 *    https://beta.eu.did.msidentity.com/v1.0/<tenant_id>/verifiableCredential/contracts/<verifiable_credential_schema>
 *   authority: optional. if not provided, we'll use the azClientId to create the Tenanted format if provided should be one of these two formats:
 *    - Tenanted: https://login.microsoftonline.com/{tenant}/, where {tenant} is either the GUID representing the tenant ID or a domain name associated with the tenant.
 *    - Work and school accounts: https://login.microsoftonline.com/organizations/.
 *   scopes?: scopes that you want to access via this authentication
 *   skipCache?: whether to skip cache
 */
export interface IMsAuthenticationClientCredentialArgs {
  azClientId: string
  azTenantId: string
  azClientSecret: string
  credentialManifestUrl: string
  authority?: string
  region?: string
  scopes?: string[]
  skipCache?: boolean
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

export type IRequiredContext = IAgentContext<Record<string, never>>
export type IMsAuthenticationResponse = String
