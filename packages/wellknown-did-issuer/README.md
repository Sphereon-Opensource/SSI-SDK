<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>Well-Known DID Issuer (Typescript) 
  <br>
</h1>

---

**Warning: This package still is in very early development. Breaking changes without notice will happen at this point!**

---

A `Sphereon SSI-SDK` plugin to create DID configuration resources and domain linkage credentials conforming to the DIF [spec for well-known DID Configurations](https://identity.foundation/.well-known/resources/did-configuration/). It is written in Typescript and can be compiled to any target JavaScript version.

## Available functions

- addLinkedDomainsService
- getDidConfigurationResource
- issueDidConfigurationResource
- issueDomainLinkageCredential
- registerCredentialIssuance
- removeCredentialIssuance
- saveDidConfigurationResource

## Usage

### Adding the plugin to an agent:

```typescript
import { IWellKnownDidIssuer, WellKnownDidIssuer } from '@sphereon/ssi-sdk.wellknown-did-issuer'

const agent = createAgent<IWellKnownDidIssuer>({
  plugins: [
    new WellKnownDidIssuer({
      credentialIssuances: { issueVc: () => Promise.resolve({ ...attestationCredential }) },
    }),
  ],
})
```

### Register credential issuance callback:

Registers a callback function.

```typescript
agent
  .registerCredentialIssuance({
    callbackName: 'example_key',
    credentialIssuance: () => Promise.resolve({ ...attestationCredential }),
  })
  .then(() => console.log('success'))
  .catch(() => console.log('failed'))
```

### Remove credential issuance callback:

Removes a registered callback function.

```typescript
agent
  .removeCredentialIssuance({ callbackName: 'example_key' })
  .then(() => console.log('success'))
  .catch(() => console.log('failed'))
```

### Issue DID configuration resource:

Issues a DID configuration resource. Can optionally save it to a database using the `save` flag.

```typescript
agent
  .issueDidConfigurationResource({
    issuances: [
      {
        did: DID,
        origin: ORIGIN,
        issuanceDate: new Date().toISOString(),
        expirationDate: new Date().toISOString(),
        options: { proofFormat: ProofFormatTypesEnum.JSON_WEB_TOKEN },
      },
    ],
    credentialIssuance: 'example_key',
    save: true,
  })
  .then((result: IDidConfiguration) => console.log(result))
  .catch(() => console.log('failed'))
```

### Get DID configuration resource:

Get a DID configuration resource from the database.

```typescript
agent
  .getDidConfigurationResource({
    origin: 'https://example.com',
  })
  .then((result: IDidConfiguration) => console.log(result))
  .catch(() => console.log('failed'))
```

### Save DID configuration resource:

Saves a DID configuration resource to a database.

```typescript
agent
  .saveDidConfigurationResource({
    origin: 'https://example.com',
    didConfiguration,
  })
  .then((result: IResourceValidation) => console.log(result.status))
```

### Issue domain linkage credential:

Issues a domain linkage credential. Can optionally save it to a database using the `save` flag.

```typescript
agent
  .issueDomainLinkageCredential({
    did: DID,
    origin: ORIGIN,
    issuanceDate: new Date().toISOString(),
    expirationDate: new Date().toISOString(),
    options: { proofFormat: ProofFormatTypesEnum.JSON_WEB_TOKEN },
    credentialIssuance: 'example_key',
    save: true,
  })
  .then((result: IResourceValidation) => console.log(result.status))
```

### Add linked domains service:

Adds a LinkedDomains service to a DID.

```typescript
agent
  .addLinkedDomainsService({
    did: 'did:key:example',
    origin: 'https://example.com',
    servideId: 'linkedDomains1',
  })
  .then((result: IResourceValidation) => console.log(result.status))
```

## Installation

```shell
yarn add @sphereon/ssi-sdk.wellknown-did-issuer
```

## Build

```shell
yarn build
```
