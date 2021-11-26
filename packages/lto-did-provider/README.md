<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>Ssi-sdk-lto-did-provider (Typescript) 
  <br>
</h1>

Lto-did-provider is a Veramo plugin to create and delete DIDs and to add and manage verification methods on LTO Network.

### createIdentifier

Creating a DID means you have to create a public/private keypair first. You can do this using lto-api package or any other means to create a ed25519 keypair. We are accepting an optional ed25519 private key to keep it flexible for everyone.

```js
const privateKeyHex = '18a58bad89...'

const identifier = await ltoDIDProvider.createIdentifier(
  {
    options: {
      privateKeyHex,
    },
  },
  context
)
```

### addKey

You can add one or more verification methods to an existing DID, or you can add them during DID creation. Internally this is accomplished using LTO Networks, associations. This means new private/public keypairs are needed. Again you can use your own ed25519 private key.

```js
 import { LtoVerificationMethod } from '@sphereon/lto-did-ts'

 const key = {
  kid: 'did:lto:1234567890abc',
  kms: 'local',
  type: 'Ed25519' as const,
  privateKeyHex,
  publicKeyHex: '27f3h29f3h7...',
}

 const did = await ltoDIDProvider.addKey({
    identifier,
    key,
    options: {
      verificationMethod: LtoVerificationMethod.VerificationMethod,
    },
  }, context)
```

### Installation

```shell
yarn add @sphereon/ssi-sdk-lto-did-provider
```

### Build

```shell
yarn build
```
