<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>DID Auth SIOP OP Authenticator (Typescript) 
  <br>
</h1>

---

**Warning: This package still is in very early development. Breaking changes without notice will happen at this point!**

---

A Veramo authentication plugin using the [Self Issued OpenID Provider v2 (SIOP)](https://github.com/Sphereon-Opensource/did-auth-siop) authentication library for having clients / people conforming to
the [Self Issued OpenID Provider v2 (SIOPv2)](https://openid.net/specs/openid-connect-self-issued-v2-1_0.html)
and [OpenID Connect for Verifiable Presentations (OIDC4VP)](https://openid.net/specs/openid-connect-4-verifiable-presentations-1_0.html)
as specified in the OpenID Connect working group.

## Self Issued OpenID Provider v2 (SIOP)

For more information about [Self Issued OpenID Provider v2 (SIOP)](https://github.com/Sphereon-Opensource/did-auth-siop#introduction), see the documentation in the readme.

## Requirements

For this plugin a DID resolver is also required. A DID resolver can be added to the agent as plugin as seen in the example below.

## Available functions

- getSessionForSiop
- registerSessionForSiop
- removeSessionForSiop
- registerCustomApprovalForSiop
- removeCustomApprovalForSiop
- authenticateWithSiop
- getSiopAuthorizationRequestFromRP
- getSiopAuthorizationRequestDetails
- verifySiopAuthorizationRequestURI
- sendSiopAuthorizationResponse

The following functions can also be used on the session object without the need of a session id first.

- authenticateWithSiop
- getSiopAuthorizationRequestFromRP
- getSiopAuthorizationRequestDetails
- verifySiopAuthorizationRequestURI
- sendSiopAuthorizationResponse

## Usage

### Adding the plugin to an agent:

```typescript
import { IDidAuthSiopOpAuthenticator } from '@sphereon/ssi-sdk-did-auth-siop-authenticator'
import { Resolver } from 'did-resolver'
import { getDidKeyResolver } from '@veramo/did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { getUniResolver } from '@sphereon/did-uni-client'

const agent = createAgent<IDidAuthSiopOpAuthenticator & IResolver>({
  plugins: [
    new DidAuthSiopOpAuthenticator(),
    new DIDResolverPlugin({
      resolver: new Resolver({
        ...getDidKeyResolver(),
        ...getUniResolver('lto', { resolveUrl: 'https://uniresolver.test.sphereon.io/1.0/identifiers' }),
        ...getUniResolver('factom', { resolveUrl: 'https://uniresolver.test.sphereon.io/1.0/identifiers' }),
      }),
    }),
  ],
})
```

### Get an OP session:

```typescript
const sessionId = 'example_session_id'
const opSession = await agent.getSessionForSiop({
  sessionId,
})
```

### Register an OP session:

```typescript
const sessionId = 'example_session_id'
const identifier = {
  did: 'did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a',
  provider: 'example_provider',
  controllerKeyId: `did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a#controller`,
  keys: [
    {
      kid: `did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a#controller`,
      kms: 'example_kms',
      type: 'Ed25519' as const,
      publicKeyHex: '1e21e21e...',
      privateKeyHex: 'elfcvtswdbn...',
    },
  ],
  services: [],
}

const opSession = await agent.registerSessionForSiop({
  sessionId,
  identifier,
})
```

### Remove an OP session:

```typescript
const sessionId = 'example_session_id'
const opSession = await agent.removeSessionForSiop({
  sessionId,
})
```

### Authenticate with DID auth SIOP:

It is possible to register custom approval functions as an extra confirmation before sending the authentication response.
These functions can then be used as an optional parameter. It is also possible to directly provide a custom approval function.

These custom approval functions can also be provided at agent creation.

```typescript
await agent.registerCustomApprovalForSiop({
  key: 'example_key',
  customApproval: (verifiedAuthorizationRequest: VerifiedAuthorizationRequest) => Promise.resolve(),
})
```

```typescript
const sessionId = 'example_session_id'
const stateId = 'example_state_id'
const redirectUrl = 'https://example.com'
const customApprovalKey = 'example_key'
const authenticationResponse = await agent.authenticateWithSiop({
  sessionId,
  stateId,
  redirectUrl,
  customApproval: customApprovalKey,
})
```

```typescript
const authenticationResponse = await agent.authenticateWithSiop({
  sessionId,
  stateId,
  redirectUrl,
  customApproval: (verifiedAuthorizationRequest: VerifiedAuthorizationRequest) => {
    return Promise.resolve()
  },
})
```

### Get authorization request from the relying party:

For more detailed information see: [Self Issued OpenID Provider v2 (SIOP)](https://github.com/Sphereon-Opensource/did-auth-siop#rp-creates-the-authentication-request)

```typescript
const sessionId = 'example_session_id'
const stateId = 'example_state_id'
const redirectUrl = 'https://example.com'
const authorizationRequest = await agent.getSiopAuthorizationRequestFromRP({
  sessionId,
  stateId,
  redirectUrl,
})
```

### Get authorization request details:

For more detailed information see: [Self Issued OpenID Provider v2 (SIOP)](https://github.com/Sphereon-Opensource/did-auth-siop#op-presentation-exchange)

```typescript
const sessionId = 'example_session_id'
const authorizationRequestDetailsResponse = await agent.getSiopAuthorizationRequestDetails({
  sessionId,
  verifiedAuthorizationRequest: createAuthorizationResponse,
})
```

### Verify authorization request URI:

For more detailed information see: [Self Issued OpenID Provider v2 (SIOP)](https://github.com/Sphereon-Opensource/did-auth-siop#op-authentication-request-verification)

```typescript
const sessionId = 'example_session_id'
const verifiedAuthorizationResponse = await agent.verifySiopAuthorizationRequestURI({
  sessionId,
  requestURI: createAuthorizationResponse,
})
```

### Send authorization response:

For more detailed information see: [Self Issued OpenID Provider v2 (SIOP)](https://github.com/Sphereon-Opensource/did-auth-siop#op-creates-the-authentication-response-using-the-verified-request)

```typescript
const sessionId = 'example_session_id'
const authorizationResponse = await agent.sendSiopAuthorizationResponse({
  sessionId,
  verifiedAuthorizationRequest: verifiedAuthorizationResponse,
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
