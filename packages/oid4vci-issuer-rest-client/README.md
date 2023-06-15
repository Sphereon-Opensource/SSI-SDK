<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>OID4VCI Issuer REST Client
  <br>
</h1>

---

**Warning: This package still is in very early development. Breaking changes without notice will happen at this point!**

---

# ssi-sdk.oid4vci-issuer-rest-client

A SSI-SDK plugin with types/interfaces and utility functions for calling rest endpoints of OID4VCI

## Available functions

- vciClientCreateOfferUri

### Adding the plugin to an agent:

```typescript
import { OID4VCIRestClient } from '@sphereon/ssi-sdk.oid4vci-issuer-rest-client'

const agent = createAgent<IOID4VCIRestClient>({
  plugins: [
    new OID4VCIRestClient({
      baseUrl: 'my-issuer-base-url',
    }),
  ],
})
```

### Getting a credential offering uri:

```typescript
const request: IVCIClientCreateOfferUriRequestArgs = {
  baseUrl: 'https://ssi-backend.sphereon.com',
  grants: {
    'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
      'pre-authorized_code': '1234',
      user_pin_required: false,
    },
  },
  credentials: ['dbc2023'],
}

const result: IVCIClientCreateOfferUriResponse = await agent.vciClientCreateOfferUri(request)
```

### Installation

```shell
yarn add @sphereon/ssi-sdk.oid4vci-issuer-rest-client
```

### Build

```shell
yarn build
```

### Test

The test command runs:

- `prettier`
- `jest`
- `coverage`

You can also run only a single section of these tests, using for example `yarn test:unit`.

```shell
yarn test
```

### Utility scripts

There are other utility scripts that help with development.

- `yarn fix` - runs `eslint --fix` as well as `prettier` to fix code style.
