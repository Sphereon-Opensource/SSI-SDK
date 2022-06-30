import { ClientCredentialAuthenticator, UsernamePasswordAuthenticator } from "../src";

describe('@sphereon/ms-authenticator', () => {

  it('should authenticate using clientCredential', async () => {

    return await expect(ClientCredentialAuthenticator({
      azClientId: '04c2bd60-cdbf-4935-80dd-110fdf473e6e',
      azClientSecret:'<YOUR_CCLIENT_SECRET>',
      azTenantId: 'e2a42b2f-7460-4499-afc2-425315ef058a',
      credentialManifestUrl:'https://beta.eu.did.msidentity.com/v1.0/e2a42b2f-7460-4499-afc2-425315ef058a/verifiableCredential/contracts/VerifiedCredentialExpert2'
    })).resolves.not.toBeNull();
  });

  it('should authenticate using usernamePassword', async () => {
    return await expect(UsernamePasswordAuthenticator({
      azTenantId: 'e2a42b2f-7460-4499-afc2-425315ef058a',
      azClientId: '04c2bd60-cdbf-4935-80dd-110fdf473e6e',
      scopes: ["user.read"],
      username: '<YOUR_USERNAME>',
      password:'<YOUR_PASSWORD>',
    })).resolves.not.toBeNull();
  });
})