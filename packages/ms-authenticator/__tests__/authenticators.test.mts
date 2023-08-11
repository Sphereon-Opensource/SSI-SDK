import { getMSClientCredentialAccessToken, UsernamePasswordAuthenticator } from '../src/index.mjs'
import * as process from 'process'
import { describe, it, expect } from 'vitest'

describe('@sphereon/ssi-sdk.ms-authenticator', () => {
  it('should authenticate using clientCredential', async () => {
    return await expect(
      getMSClientCredentialAccessToken({
        azClientId: process.env.SPHEREON_SSI_MSAL_CLIENT_ID || 'client_id',
        azClientSecret: process.env.SPHEREON_SSI_MSAL_CLIENT_SECRET || 'client_secret',
        azTenantId: process.env.SPHEREON_SSI_MSAL_TENANT_ID || 'tenant_id',
        credentialManifestUrl:
          'https://beta.eu.did.msidentity.com/v1.0/e2a42b2f-7460-4499-afc2-425315ef058a/verifiableCredential/contracts/VerifiedCredentialExpert2',
      })
    ).resolves.toBeDefined()
  })

  it('should authenticate using usernamePassword', async () => {
    return await expect(
      UsernamePasswordAuthenticator({
        azTenantId: process.env.SPHEREON_SSI_MSAL_TENANT_ID || 'tenant_id',
        azClientId: process.env.SPHEREON_SSI_MSAL_CLIENT_ID || 'client_id',
        scopes: ['user.read'],
        username: process.env.SPHEREON_SSI_MSAL_USERNAME || 'username',
        password: process.env.SPHEREON_SSI_MSAL_PASSWORD || 'password',
      })
    ).resolves.toBeDefined()
  })
})
