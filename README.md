<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>SSI-SDK (Typescript) 
  <br>
</h1>

This is an SSI SDK based on the great work done by [Veramo](https://veramo.io). It contains plugins that extend the Veramo framework:

- DIDs and Key management:
  - factom: [Factom DID creation](./packages/lto-did-provider/README.md) (WIP)
  - lto: [LTO Network DID creation and Verification Methods](./packages/lto-did-provider/README.md)
  - ion: ION creation (WIP)
- VC API:
  - VC API issuer: Issue VCs using the VC (HTTP) Api
  - VC API verifier: Verify VCs and VPs using the VC (HTTP) Api
- Self Issued OpenID Connect v2 and OpenID Connect for Verifiable Presentations
  - SIOPv2 (WIP)

    
#### ssi-sdk-core
This package contains types and methods shared by the other plugins


#### factom-did-provider
factom-did-provider is a Veramo plugin to create DIDs on the Factom Protocol.

[factom-did-provider readme](./packages/factom-did-provider/README.md)

#### lto-did-provider
Lto-did-provider is a Veramo plugin to create DIDs and to add and manage verification methods on LTO Network.

[lto-did-provider readme](./packages/lto-did-provider/README.md)

### DID resolution

---
**Note:**
DID resolution is not part of this SDK. We do provide a Universal DID client you can use in Veramo, simply by using the below code when setting up the Agent:

````typescript
export const agent = createAgent<IDIDManager & CredentialIssuerLD & IKeyManager & IDataStore & IDataStoreORM & IResolver>({
  plugins: [
    // Other plugins
    new DIDResolverPlugin({
      resolver: new UniResolver({ resolveURL: 'https://dev.uniresolver.io/1.0/identifiers'} )
    })
  ]
})
````

### Lerna
The SSI-SDK makes use of Lerna for managing multiple packages. Lerna is a tool that optimizes the workflow around managing multi-package repositories with git and npm / yarn.

### Build
```shell
yarn build
```

### Test
The test command runs:
* `jest`
* `coverage`

You can also run only a single section of these tests, using for example `yarn test:watch`.
```shell
yarn test
```

### Utility scripts
There are other utility scripts that help with development.

* `yarn prettier` - runs `prettier` to fix code style.

### Publish
There are scripts that can publish the following versions:
* `latest`
* `next`
* `unstable`

```shell
yarn publish:[version]
```
