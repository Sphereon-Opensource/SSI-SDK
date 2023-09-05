<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>SSI SDK 
  <br>
</h1>

# SSI SDK with OID4VC, Presentation Exchange, MS Entra support

This mono repository, contains packages that add support for Presentation Exchange and OpenID4VC (SIOPv2, OID4VCI,
OID4VP) and other functionalities to SSI-SDK and [Veramo](https://veramo.io) based agents.

We also have additional DID methods and BBS+, RSA key support in
our [SSI-SDK crypto extensions](https://github.com/Sphereon-Opensource/ssi-sdk) project, that are compatible with this
SSI-SDK and [Veramo](https://veramo.io).

The modules can be integrated in agents running on the issuer, holder and verifier sides, both directly into
typescript/javascript projects using NodeJS, mobile projects using React-Native, your browser, or other programming
languages using
the REST APIs.

## OpenID for Verifiable Credentials (OID4VC)

This is a new [set of specifications](https://openid.net/openid4vc/) by the [OpenID Foundation](https://openid.net/), that enable peer to peer authentication ([SIOPv2](https://openid.net/specs/openid-connect-self-issued-v2-1_0.html)),
Credential Issuance ([OID4VCI](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html)) and Credential Presentation/Verification ([OID4VP](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)). The SSI-SDK modules offer
higher-level and more tight integrations for these specification than our lower level libraries,
like [OID4VCI](https://github.com/Sphereon-OpenSource/OID4VCI), [SIOPv2 & OID4VP](https://github.com/Sphereon-Opensource/SIOP-OID4VP) and [Well-known DIDs](https://github.com/Sphereon-Opensource/wellknown-did-client).

These low-level libraries are typically not too opinionated and require an implementor to do some more work like providing
signature/key callback functions. Contrary this
SSI-SDK is more opinionated and requires you to use other modules of the SSI-SDK or Veramo to provide certain
functionalities, like DID and key management. The benefit however is that it provides a fully working agent solution
with a low amount of
configuration and/or additional coding in your solution, and a rich ecosystem of plugins.

If you want to test out some of these plugins, we highly recommend using
our [Open-Source wallet](https://github.com/Sphereon-Opensource/ssi-mobile-wallet)
and/or [SIOPv2-OID4VP demo](https://github.com/Sphereon-Opensource/SIOPv2-OpenID4VP-example) deployed
at https://ssi.sphereon.com, which are using the plugins below.

| Plugin                                                                             | Description                                                                                                                                                                                                                                                                                                                                                                                                                                     |
|------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [Presentation Exchange](./packages/presentation-exchange)                          | Allows to persist and manage v1 and v2 Presentation Definitions, as well as Verify Presentation Definitions, create Verifiable Presentations with Submission Data, select and match Credentials and DIDs all stored in the agent. Can be used in both Relying Party/Verifier contexts as holder contexts                                                                                                                                        |
| [OID4VCI Issuer storage](./packages/oid4vci-issuer-store)                          | Allows to persist and manage OpenID4VCI Metadata and options in the agent database                                                                                                                                                                                                                                                                                                                                                              |
| [OID4VCI Issuer](./packages/oid4vci-issuer)                                        | OpenID for Verifiable Credentials Issuer core logic and functions. This is the integration of the agent with the low-level OID4VCI client library                                                                                                                                                                                                                                                                                               |
| [OID4VCI Issuer REST API](./packages/oid4vci-issuer-rest-api)                      | OpenID for Verifiable Credentials Issuer REST API. Exposes both OID4VCI endpoints, as well as status/management endpoints.                                                                                                                                                                                                                                                                                                                      |
| [OID4VCI Issuer REST client](./packages/oid4vci-issuer-rest-client)                | OpenID for Verifiable Credentials Issuer REST client, allowing for easy integration and communication from a webapp with the REST API of the agent.                                                                                                                                                                                                                                                                                             |
| [SIOPv2 Authenticator with OID4VP support](./packages/siopv2-oid4vp-op-auth)       | OpenID Provider for a wallet/holder context, that allows the agent to authenticate with SIOPv2 against the Relying Party and optionally use OpenID4VP to transport Verifiable Credentials. It is integrated into Key Management system, DID providers and VC modules. Supports JWT and JSON-LD VCs and has support for the [JWT VC Presentation Profile](https://identity.foundation/jwt-vc-presentation-profile/)                              |
| [SIOPv2 Relying Party logic with OID4VP support](./packages/siopv2-oid4vp-rp-auth) | Plugin for a Relying Party agent context, containing the core logic to create Authorization Requests, verify Authorization Responses, as well as handle/manage Presentation Definitions and verifications (OID4VP). It is integrated into the Key Management system, DID providers and VC modules. Supports JWT and JSON-LD VCs and has support for the [JWT VC Presentation Profile](https://identity.foundation/jwt-vc-presentation-profile/) |
| [SIOPv2 Relying Party REST API](./packages/siopv2-oid4vp-rp-rest-api)              | Plugin for a Relying Party agent context, it exposes a REST API which allows to integrate into webapps/websites. Support sessions and multiple presentation definitions. You typically run this as a separate agent to your application, but it could be integrated if you want.                                                                                                                                                                |
| [SIOPv2 Relying Party REST client](./packages/siopv2-oid4vp-rp-rest-client)        | Plugin for a Relying Party webapp, it exposes a REST client, allowing for easy integration and communication from the Webapp with the REST API of the Agent. Support creating QR codes for different Presentation Definitions as well as Session Handling.                                                                                                                                                                                      |

## Microsoft:registered: Entra Verified ID

The below packages add direct support for Microsoft:registered: Entra Verified ID. These plugins are using Microsoft
libraries and REST APIs.
Please note that you do not have to use these plugins to be able to support Microsoft:registered: Authenticator, have
your agent
verify Verifiable Credentials issued by Entra Verified ID, or have your agent communicate with Microsoft Entra Verified
ID SIOPv2/OID4VP. The above OID4VC plugins can do these tasks without requiring a direct integration with Microsoft:
registered: Entra
Verified ID as they conform to the same standards. The biggest exception is issuing VCs using Microsoft:registered:
Entra Verified ID. Entra Verified ID will soon have
support for OID4VCI, until that time you will have to use their Request API to issue credentials from Entra Verified ID

| Plugin                                                                                 | Description                                                                                                                              |
|----------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| [Microsoft:registered: Azure :registered: Authenticator](./packages/ms-authenticator) | Plugin to authenticate using the Microsoft:registered: Authentication Library (MSAL) against Microsoft:registered: Azure :registered:. |
| [Entra Verified ID Request API](./packages/ms-request-api)                             | Plugin to use Microsoft:registered: Entra Verified ID's Request API (REST) to issue/verify Verifiable Credentials                       |

## Well-known DIDs

Well-known DIDs allow you to bind domain names to DIDs, by making clever use of Verifiable Credentials signed by the
respective DIDs, hosting the result in a well-known location, and then linking to this location from the DIDs itself
using service endpoints.
We have a [low-level library](https://github.com/Sphereon-Opensource/wellknown-did-client) for managing well-known DIDs.
The packages in the SSI-SDK provide an integration into DIDs managed by agents using the SDK or Veramo.

| Plugin                                                       | Description                                                                             |
|--------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| [well-known DID issuer](./packages/wellknown-did-issuer)     | Supports managing well-known DIDs and configurations. Allows to store them in the agent |
| [well-known DID verifier](./packages/wellknown-did-verifier) | Verified DIDs and domains to conform to the well-known DID specification                |

## Contacts and storage

The contact-manager plugin allows you to persist external agent systems like issuers and verifiers. It supports multiple
identifiers per contact in the form of correlationIDs, which are URIs as well as assign roles like issuers, holders,
verifiers. Typically on a first encounter you would provide a UI to the user asking to provide a name if the protocol
cannot already prefill a name. Then the contact gets stored, so simple names can be used instead of DIDs in a UI for
instance. It can also be used to manage trust when encountering a certain contact in the future.

| Plugin                                        | Description                                                                       |
|-----------------------------------------------|-----------------------------------------------------------------------------------|
| [data-store](./packages/data-store)           | TypeORM based contact store to persist and query entities (contacts, identities)  |
| [contact-manager](./packages/contact-manager) | Manage contacts and their related identities                                      |

## Issuance branding and storage

The issuance-branding plugin allows you to persist branding for issuers and credentials. This allows for these entities to be styled even when there 
is no active connection possible to the external parties. It supports logo's, background attributes like an image and or color, text color and 
additional branding information per locale.

| Plugin                                            | Description                                                                              |
|---------------------------------------------------|------------------------------------------------------------------------------------------|
| [data-store](./packages/data-store)               | TypeORM based issuance branding store to persist and query branding (issuer, credential) |
| [issuance-branding](./packages/issuance-branding) | Manage issuer and credential branding                                                    |

## Generic SSI plugins

Next to the below plugins, we suggest to check out the excelent work done by the Veramo team on
the [Veramo](https://veramo.io) website. All these SSI-SDK plugins are compatible with Veramo (4.X). Hence you can mix
and match the plugins from the SSI-SDK with Veramo plugins. The below plugins add additional functionalities or replace
functionalities in Veramo.

| Plugin                                                                                    | Description                                                                                                                                                                                   |
|-------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [SSI Types](./packages/ssi-types)                                                         | Generic interfaces for Verifiable Credentials (JWT and JSON-LD) and DIDs. Also supports creating a uniform representation of Credentials, no matter whether they are in JWT or JSON-LD format |
| [SSI Core](./packages/ssi-sdk-core)                                                       | Adds generic functions used by other plugins, like signing, encoding/decoding                                                                                                                 |
| [DID Utils & Key Utils](https://github.com/Sphereon-Opensource/SSI-SDK-crypto-extensions) | Generic key and DID utils can be found in our [SSI SDK Crypto Extensions repo](https://github.com/Sphereon-Opensource/SSI-SDK-crypto-extensions)                                              |
| [JSON LD issuer/verified](./packages/vc-handler-ld-local)                                 | Adds JSON-LD issuance and verification for Verifiable Credentials. Integrates seamlessly with Veramo's W3C VC plugin                                                                          |
| [QR code generator](./packages/qr-code-generator)                                         | Create generic, SIOPv2/OID4VP, OID4VCI and WACI PEX QR codes. This package specifically targets React and React-Native                                                                        |

# DID resolution

---
**Note:**
DID resolution is not part of this SDK. We do provide a Universal DID client you can use in Veramo, simply by using the
below code when setting up the Agent:

Using the Universal resolver for all DID methods:

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

Using the Universal resolver for specific DID methods and DID-key:

````typescript
export const agent = createAgent<IDIDManager & CredentialIssuerLD & IKeyManager & IDataStore & IDataStoreORM & IResolver>({
  plugins: [
    // Other plugins
    new DIDResolverPlugin({
      resolver: new Resolver({
        ...getDidKeyResolver(),
        ...getUniResolver('lto', { resolveUrl: 'https://uniresolver.test.sphereon.io/1.0/identifiers' }),
        ...getUniResolver('factom', { resolveUrl: 'https://dev.uniresolver.io/1.0/identifiers' }),
      }),
    }),
  ]
})
````

# Building and testing

## Lerna

The SSI-SDK makes use of Lerna for managing multiple packages. Lerna is a tool that optimizes the workflow around
managing multi-package repositories with git and npm / yarn.

## Build

The below command builds all packages for you using lerna

```shell
yarn build
```

## Test

The test command runs:

* `jest`
* `coverage`

You can also run only a single section of these tests, using for example `yarn test:watch`.

```shell
yarn test
```

## Utility scripts

There are other utility scripts that help with development.

* `yarn prettier` - runs `prettier` to fix code style.

## Publish

There are scripts that can publish the following versions:

* `latest`
* `next`
* `unstable`

```shell
yarn publish:[version]
```
