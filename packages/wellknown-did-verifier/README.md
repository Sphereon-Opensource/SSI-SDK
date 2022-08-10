<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>Well-Known DID Verifier (Typescript) 
  <br>
</h1>

---

**Warning: This package still is in very early development. Breaking changes without notice will happen at this point!**

---

A `Sphereon SSI-SDK` plugin to verify relationships between the controller of an origin and a DID and to verify DID configuration resources.

## Available functions
* registerSignatureValidation
* removeSignatureValidation
* verifyDomainLinkage
* verifyDidConfigurationResource

## Usage

### Adding the plugin to an agent:

```typescript
import { 
  IWellKnownDidVerifier, 
  WellKnownDidVerifier 
} from '@sphereon/ssi-sdk-wellknown-did-verifier';

const agent = createAgent<IWellKnownDidVerifier>({
  plugins: [
    new WellKnownDidVerifier({
      signatureVerifications: {'verified': () => Promise.resolve({ verified: true })},
      onlyVerifyServiceDids: true
    }),
  ],
})
```

### Register signature verification callback:

```typescript
agent.registerSignatureVerification({
  key: 'example_key',
  signatureVerification: () => Promise.resolve({ verified: true })
})
  .then(() => console.log('success'))
  .catch(() => console.log('failed'))
```

### Remove signature verification callback:

```typescript
agent.removeSignatureVerification({ key: 'example_key' })
  .then(() => console.log('success'))
  .catch(() => console.log('failed'))
```

### Verify domain linkage:

```typescript
agent.verifyDomainLinkage({
  didUrl: 'did:key:z6MkoTHsgNNrby8JzCNQ1iRLyW5QQ6R8Xuu6AA8igGrMVPUM#foo',
  signatureVerification: 'verified',
  onlyVerifyServiceDids: false
})
.then((result: IDomainLinkageValidation) => console.log(result.status))
```

### Verify DID configuration resource:

You can either pass in a DID configuration resource or fetch it remotely by setting a secure well-known location (origin). 

```typescript
agent.verifyDidConfigurationResource({
  signatureVerification: () => Promise.resolve({ verified: true }),
  origin: 'https://example.com'
})
.then((result: IResourceValidation) => console.log(result.status))
```

## Installation

```shell
yarn add @sphereon/ssi-sdk-wellknown-did-verifier
```

## Build

```shell
yarn build
```
