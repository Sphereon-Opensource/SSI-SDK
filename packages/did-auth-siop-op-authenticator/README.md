<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>DID Auth SIOP OP Authenticator (Typescript) 
  <br>
</h1>

---

**Warning: This package still is in every early development. Breaking changes without notice will happen at this point!**

---

A Veramo operating party authentication plugin using the [Self Issued OpenID Provider v2 (SIOP)](https://github.com/Sphereon-Opensource/did-auth-siop) authentication library for having clients / people conforming to
the [Self Issued OpenID Provider v2 (SIOPv2)](https://openid.net/specs/openid-connect-self-issued-v2-1_0.html)
and  [OpenID Connect for Verifiable Presentations (OIDC4VP)](https://openid.net/specs/openid-connect-4-verifiable-presentations-1_0.html)
as specified in the OpenID Connect working group.

## Self Issued OpenID Provider v2 (SIOP)

For more information about [Self Issued OpenID Provider v2 (SIOP)](https://github.com/Sphereon-Opensource/did-auth-siop#introduction), see the documentation in the readme.

## Requirements
For this plugin a DID resolver is also required. A DID resolver can be added to the agent as plugin as seen in the example below.

## Available functions

* getDidSiopSession
* addDidSiopSession
* removeDidSiopSession
* registerCustomApprovalForDidSiop
* removeCustomApprovalForDidSiop
* authenticateWithDidSiop
* getDidSiopAuthenticationRequestFromRP
* getDidSiopAuthenticationRequestDetails
* verifyDidSiopAuthenticationRequestURI
* sendDidSiopAuthenticationResponse

## Usage

### Adding the plugin to an agent:

```js
import { IDidAuthSiopOpAuthenticator } from '@sphereon/ssi-sdk-did-auth-siop-authenticator'

const agent = createAgent<IDidAuthSiopOpAuthenticator & IResolver>({
  plugins: [
    new DidAuthSiopOpAuthenticator(),
    new DIDResolverPlugin({
      resolver: new Resolver({
        ...ethrDidResolver({ infuraProjectId: INFURA_PROJECT_ID }),
        ...webDidResolver(),
      }),
    }),
  ],
});
```

### Get an OP session:

```js
const sessionId = 'example_session_id'
const opSession = await agent.getDidSiopSession({
  sessionId
})
```

### Add an OP session:

```js
const sessionId = 'example_session_id'
const identifier = {
  did: 'did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a',
  provider: 'example_provider',
  controllerKeyId: `did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a#controller`,
  keys: [{
    kid: `did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a#controller`,
    kms: 'example_kms',
    type: 'Ed25519' as const,
    publicKeyHex: '1e21e21e...',
    privateKeyHex: 'elfcvtswdbn...'
  }],
  services: []
}

const opSession = await agent.addDidSiopSession({
  sessionId,
  identifier,
})
```

### Remove an OP session:

```js
const sessionId = 'example_session_id'
const opSession = await agent.removeDidSiopSession({
  sessionId
})
```

### Authenticate with DID auth SIOP:

It is possible to register custom approval functions as an extra confirmation before sending the authentication response.
These functions can then be used as an optional parameter. It is also possible to directly provide a custom approval function.

These custom approval functions can also be provided at agent creation.

```js
await agent.registerCustomApprovalForDidSiop({
  key: 'example_key',
  customApproval: (verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT) => Promise.resolve()
})
```

```js
const sessionId = 'example_session_id'
const stateId = 'example_state_id'
const redirectUrl = 'https://example.com'
const didMethod = 'ethr'
const customApprovalKey = 'example_key'
const authenticationResponse = await agent.authenticateWithDidSiop({
  sessionId,
  stateId,
  redirectUrl,
  didMethod,
  customApproval: customApprovalKey,
})
```

```js
const authenticationResponse = await agent.authenticateWithDidSiop({
  sessionId,
  stateId,
  redirectUrl,
  didMethod,
  customApproval: (verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT) => {
    return Promise.resolve()
  },
})
```

### Get authentication request from the relying party:

For more detailed information see: [Self Issued OpenID Provider v2 (SIOP)](https://github.com/Sphereon-Opensource/did-auth-siop#rp-creates-the-authentication-request) 

```js
const sessionId = 'example_session_id'
const stateId = 'example_state_id'
const redirectUrl = 'https://example.com'
const createAuthenticationResponse = await agent.getDidSiopAuthenticationRequestFromRP({
  sessionId,
  stateId,
  redirectUrl,
})
```

### Get authentication request details:

For more detailed information see: [Self Issued OpenID Provider v2 (SIOP)](https://github.com/Sphereon-Opensource/did-auth-siop#op-presentation-exchange)


```js
const sessionId = 'example_session_id'
const authenticationRequestDetailsResponse = await agent.getDidSiopAuthenticationRequestDetails({
  sessionId,
  verifiedAuthenticationRequest: createAuthenticationResponse,
  verifiableCredentials: [credential],
})
```

### Verify authentication request URI:

For more detailed information see: [Self Issued OpenID Provider v2 (SIOP)](https://github.com/Sphereon-Opensource/did-auth-siop#op-authentication-request-verification)

```js
const sessionId = 'example_session_id'
const verifiedAuthenticationResponse = await agent.verifyDidSiopAuthenticationRequestURI({
  sessionId,
  requestURI: createAuthenticationResponse,
})
```

### Send authentication response:

For more detailed information see: [Self Issued OpenID Provider v2 (SIOP)](https://github.com/Sphereon-Opensource/did-auth-siop#op-creates-the-authentication-response-using-the-verified-request)

```js
const sessionId = 'example_session_id'
const authenticationResponse = await agent.sendDidSiopAuthenticationResponse({
  sessionId,
  verifiedAuthenticationRequest: verifiedAuthenticationResponse,
})
```

## Installation

```shell
yarn add @sphereon/ssi-sdk-did-auth-siop-authenticator
```

## Build

```shell
yarn build
```
