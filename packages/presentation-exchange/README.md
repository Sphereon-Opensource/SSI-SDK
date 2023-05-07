<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>Presentation Exchange  
  <br>
</h1>

---

**Warning: This package still is in very early development. Breaking changes without notice will happen at this point!**

---

## Requirements

For this plugin a DID resolver is also required. A DID resolver can be added to the agent as plugin as seen in the example below.

## Available functions

## Usage

### Adding the plugin to an agent:

```typescript
import { PresentationExchange } from '@sphereon/ssi-sdk.presentation-exchange'
import { Resolver } from 'did-resolver'
import { getDidKeyResolver } from '@veramo/did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { getUniResolver } from '@sphereon/did-uni-client'

const agent = createAgent<IDidAuthSiopOpAuthenticator & IResolver>({
  plugins: [
    new PresentationExchange(),
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
yarn add @sphereon/ssi-sdk.presentation-exchange
```

## Build

```shell
yarn build
```
