<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>Ssi-sdk-jwk-did-provider 
  <br>(Typescript) 
  <br>
</h1>

This package contains an implementation of the `AbstractIdentifierProvider` for the `did:jwk` method.
Enabling creating and resolving of `did:jwk` entities, conforming to the [spec for DID-JWK](https://github.com/quartzjer/did-jwk/blob/main/spec.md)

## Available functions

- createIdentifier
- deleteIdentifier
- resolveDidJwk

## Usage

### Creating an identifier

When creating a new Veramo Identifier you can choose to import your own keys or have them generated for you. You can
also choose to use specific Key IDs for your key, regardless of generation or import.
The options object when creating an identifier is as follows:

```typescript
export interface KeyOpts {
  key?: MinimalImportableKey // Optional key to import. If not specified a key with random kmsKeyRef will be created
  type?: Key // The key type. Defaults to Secp256k1
  use?: KeyUse // The key use
}
```

### Creating an Identifier using auto-generated keys

The example below generates a JWK DID with auto-generated keys.

```typescript
const identifier: IIdentifier = await agent.didManagerCreate()
```

### Creating an Identifier using imported keys

The example below generates a JWK DID using imported keys.

```typescript
const identifier: IIdentifier = await agent.didManagerCreate({
  key: {
    privateKeyHex: '06eb9e64569203679b36f834a4d9725c989d32a7fb52c341eae3517b3aff8ee6',
  },
})
```

### Removing the Identifier and DID

Deleting an identifier is straightforward:

```typescript
const deleted: boolean = await agent.didManagerDelete({ did: identifier.did })
```

### Resolving a DID

The example below resolves a did:jwk to DIDResolutionResult.

```typescript
const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: 'did:jwk:ey....' })
```

## Installation

```shell
yarn add @sphereon/ssi-sdk-did-provider-jwk
```

## Build

```shell
yarn build
```
