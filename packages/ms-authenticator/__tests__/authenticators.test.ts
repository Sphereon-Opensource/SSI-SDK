import * as process from 'process'
import { AuthenticationResult } from '@azure/msal-node'
import { getMSClientCredentialAccessToken, UsernamePasswordAuthenticator } from '../src'
jest.setTimeout(100000)

describe('@sphereon/ssi-sdk.ms-authenticator', (): void => {
  it.skip('should authenticate using clientCredential', async (): Promise<void> => {
    // TODO REVERT
    const result: AuthenticationResult = await getMSClientCredentialAccessToken({
      azClientId: process.env.SPHEREON_SSI_MSAL_CLIENT_ID ?? 'client_id',
      azClientSecret: process.env.SPHEREON_SSI_MSAL_CLIENT_SECRET ?? 'client_secret',
      azTenantId: process.env.SPHEREON_SSI_MSAL_TENANT_ID ?? 'tenant_id',
      credentialManifestUrl:
        'https://beta.eu.did.msidentity.com/v1.0/e2a42b2f-7460-4499-afc2-425315ef058a/verifiableCredential/contracts/VerifiedCredentialExpert2',
    })

    expect(result).toBeDefined()
  })

  it.skip('should authenticate using usernamePassword', async (): Promise<void> => {
    // TODO REVERT
    const result: string = await UsernamePasswordAuthenticator({
      azTenantId: process.env.SPHEREON_SSI_MSAL_TENANT_ID ?? 'tenant_id',
      azClientId: process.env.SPHEREON_SSI_MSAL_CLIENT_ID ?? 'client_id',
      scopes: ['user.read'],
      username: process.env.SPHEREON_SSI_MSAL_USERNAME ?? 'username',
      password: process.env.SPHEREON_SSI_MSAL_PASSWORD ?? 'password',
    })

    expect(result).toBeDefined()
  })
})
