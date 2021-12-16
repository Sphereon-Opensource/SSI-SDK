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
    - mnemonic-seed: [Mnemonic Seed and Key Derivation](./packages/mnemonic-info-generator/README.md)
- Verifiable Credentials and Presentations:
    - VC API Issuer: [Issue VCs using the VC (HTTP) Api v0.1](./packages/vc-api-issuer/README.md)
    - VC API Verifier: [Verify VCs and VPs using the VC (HTTP) Api v0.1](./packages/vc-api-verifier/README.md)
    - Json-LD VC handler: [Issues and verifies JSON-LD based VCs and VPs](./packages/vc-handler-ld-local/README.md)
- OpenID Connect and Presentation Exchange:
    - SIOPv2 and
      OIDC4VP: [Self-Issued OpenID Connect and OpenID Connect for Verifiable Presentations](./packages/did-auth-siop-op-authenticator/README.md)

## SSI SDK Core

The [core package](./packages/ssi-sdk-core/README.md) contains types and methods shared by the other plugins

## Factom DID Provider

The [Factom Protocol DID Provider](./packages/factom-did-provider/README.md) is a Veramo plugin to create DIDs on the
Factom Protocol.

## LTO Network DID Provider

The [LTO Network DID Provider](./packages/lto-did-provider/README.md) is a Veramo plugin to create DIDs and to add and
manage verification methods on LTO Network.

## Mnemonic Seed

The [Mnemonic Seed and Key Derivation](./packages/mnemonic-info-generator/README.md) handles generations, secure storage
of Mnemonics, the creation of a seed out of it and the derivation of keys

## VC API Issuer

The [W3C VC (HTTP) API Issuer](./packages/factom-did-provider/README.md) is a Veramo plugin to issue Verifiable
Credentials using a [W3C VC API](https://github.com/w3c-ccg/vc-api) spec based API (currently only supporting a v0.1
spec).

## VC API Verifier

The [W3C VC (HTTP) API Verifier](./packages/factom-did-provider/README.md) is a Veramo plugin to verify Verifiable
Credentials using a [W3C VC API](https://github.com/w3c-ccg/vc-api) spec based API (currently only supporting a v0.1
spec).

## JSON-LD VC/VP Handler

The [JSON-LD VC/VP Handler](./packages/vc-handler-ld-local/README.md) handles issuance and verification of JSON-LD based
Verifiable Credentials and Verifiable Presentations

## OpenID Connect

The [Self-Issued OpenID Connect and OpenID Connect for Verifiable Presentations](./packages/did-auth-siop-op-authenticator/README.md)
plugin allows an OP to authenticate against a Relying Party using Self-Issued OpenID Connect and optionally OpenID
Connect for Verifiable Presentations, with the help of
our [Presentation-Exchange library](https://github.com/Sphereon-Opensource/pe-js).

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
