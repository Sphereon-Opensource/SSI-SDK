<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>SIOPv2 and OpenID4VP Relying Party  
  <br>
</h1>

---

**Warning: This package still is in very early development. Breaking changes without notice will happen at this point!**

---

An authentication plugin using the [Self Issued OpenID Provider v2 (SIOP)](https://github.com/Sphereon-Opensource/did-auth-siop) authentication library for having Relying Parties conforming to
the [Self Issued OpenID Provider v2 (SIOPv2)](https://openid.net/specs/openid-connect-self-issued-v2-1_0.html)
and [OpenID Connect for Verifiable Presentations (OIDC4VP)](https://openid.net/specs/openid-connect-4-verifiable-presentations-1_0.html)
as specified in the OpenID Connect working group.

## Self Issued OpenID Provider v2 (SIOPv2)

For more information about [Self Issued OpenID Provider v2 (SIOP)](https://github.com/Sphereon-Opensource/did-auth-siop#introduction), see the documentation in the readme.

## Requirements

For this plugin a DID resolver is also required. A DID resolver can be added to the agent as plugin as seen in the example below.

## Available functions

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
        ...getUniResolver('web'),
        ...getUniResolver('jwk'),
      }),
    }),
  ],
})
```

## Installation

```shell
yarn add @sphereon/ssi-sdk-siopv2-openid4vp-rp
```

## Build

```shell
yarn build
```
