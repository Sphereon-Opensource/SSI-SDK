<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>SSI SDK (Typescript) 
  <br>
</h1>

---

__Warning: These packages still is in every early development. Breaking changes without notice will happen at this
point!__

---

# SSI SDK

This is an SSI SDK based on the great work done by [Veramo](https://veramo.io). The SDK is a monorepository with
multiple packages (see lerna below). It contains plugins that extend the Veramo framework:

- DIDs and Key management:
    - factom: [Factom DID creation](./packages/lto-did-provider/README.md) (WIP)
    - lto: [LTO Network DID creation and Verification Methods](./packages/lto-did-provider/README.md)
- VC (HTTP) API:
    - VC API Issuer: [Issue VCs using the VC (HTTP) Api v0.1](./packages/vc-api-issuer/README.md)
    - VC API Verifier: [Verify VCs and VPs using the VC (HTTP) Api v0.1](./packages/vc-api-verifier/README.md)
- Self Issued OpenID Connect v2 and OpenID Connect for Verifiable Presentations
    - SIOPv2 (WIP)

## SSI SDK Core
The [core package](./packages/ssi-sdk-core/README.md) contains types and methods shared by the other plugins

## Factom DID Provider
The [Factom Protocol DID Provider](./packages/factom-did-provider/README.md) is a Veramo plugin to create DIDs on the
Factom Protocol.

## LTO Network DID Provider
The [LTO Network DID Provider](./packages/lto-did-provider/README.md) is a Veramo plugin to create DIDs and to add and
manage verification methods on LTO Network.

## VC API Issuer
The [W3C VC (HTTP) API Issuer](./packages/factom-did-provider/README.md) is a Veramo plugin to issue Verifiable Credentials
using a [W3C VC API](https://github.com/w3c-ccg/vc-api) spec based API (currently only supporting a v0.1 spec).

## VC API Verifier
The [W3C VC (HTTP) API Verifier](./packages/factom-did-provider/README.md) is a Veramo plugin to verify Verifiable
Credentials using a [W3C VC API](https://github.com/w3c-ccg/vc-api) spec based API (currently only supporting a v0.1 spec).

## DID resolution

---
**Note:**
DID resolution is not part of this SDK. We do provide a Universal DID client you can use in Veramo, simply by using the
below code when setting up the Agent:

````typescript
export const agent = createAgent<IDIDManager & CredentialIssuerLD & IKeyManager & IDataStore & IDataStoreORM & IResolver>({
  plugins: [
    // Other plugins
    new DIDResolverPlugin({
      resolver: new UniResolver({ resolveURL: 'https://dev.uniresolver.io/1.0/identifiers' })
    })
  ]
})
````


## Building and testing

### Lerna

The SSI-SDK makes use of Lerna for managing multiple packages. Lerna is a tool that optimizes the workflow around
managing multi-package repositories with git and npm / yarn.

### Build
The below command builds all packages for you using lerna

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
