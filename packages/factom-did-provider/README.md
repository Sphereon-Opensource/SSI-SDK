<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>Ssi-sdk-factom-did-provider (Typescript) 
  <br>
</h1>

Lto-factom-provider is a Veramo plugin to create DIDs on Factom Protocol.

### Constructor

During construction of the Factom DID provider you can set the defaultNetwork, universal registrar URL and the Veramo default Key Management System (KMS)

```typescript
import { FactomDIDProvider } from '@sphereon/veramo-factom-did-provider'

const factomDIDProvider = new FactomDIDProvider({
  defaultKms: 'local',
  defaultNetwork: 'testnet',
  registrarUrl: 'https://your.universal.registrar.here',
})
```

### createIdentifier

Creating a DID means you have to create public/private keypairs first both for the DID fragment itself as well as the management keys. The Factom DID Provider will store these keys using Veramo's Keymanager, so that you can use them later

```typescript
const managementKeys = [
  { priority: 0, privateKeyMultibase: 'z08a58bad89...' },
  { priority: 1, privateKeyMultibase: 'z18a58bad89...' },
]
const didKeys = [{ priorityRequirement: 1, privateKeyMultibase: 'z234a...', purpose: [] }]
const tags = ['my', 'did', 'chain', 'name', 'here'] // Used to populate Factoms external Id values
const nonce = 'random value' // If left out, will be automatically created to make the DID chain unique

const identifier = await factomDIDProvider.createIdentifier(
  {
    options: {
      managementKeys,
      didKeys,
      tags,
      nonce,
    },
  },
  context
)
```

### Installation

```shell
yarn add @sphereon/ssi-sdk-factom-did-provider
```

### Build

```shell
yarn build
```
