# `did:oyd` Provider

This package contains an implementation of the `AbstractIdentifierProvider` for the `did:oyd` method. Enabling creating and resolving of `did:oyd` entities, conforming to the [spec for OYDID](https://ownyourdata.github.io/oydid/)

## Available functions

- createIdentifier
- resolveDidOyd

## Usage

### Creating an identifier

The most simple version of creating a did:oyd is without any input parameters:

```typescript
const identifier: IIdentifier = await agent.didManagerCreate()
```

Use the following options to create a did:oyd using Client-Managed-Secret-Mode:

```typescript
const DID_METHOD = 'did:oyd'
const oydDIDProvider = new OydDIDProvider({
  defaultKms: 'mem',
  clientManagedSecretMode: {
    publicKeyCallback: some_function, // callback to provide public Key
    signCallback: some_function, // callback for signing payload
  },
})

const agent = createAgent<IKeyManager, DIDManager>({
  plugins: [
    new SphereonKeyManager({
      store: new MemoryKeyStore(),
      kms: {
        mem: new SphereonKeyManagementSystem(new MemoryPrivateKeyStore()),
      },
    }),
    new DIDManager({
      providers: {
        [DID_METHOD]: oydDIDProvider,
      },
      defaultProvider: DID_METHOD,
      store: new MemoryDIDStore(),
    }),
  ],
})

const identifier: IIdentifier = await agent.didManagerCreate()
```

### Resolving a DID

The example below resolves a did:oyd to DIDResolutionResult.

```typescript
const didResolutionResult: DIDResolutionResult = await agent.resolveDid({ didUrl: 'did:oyd:zQm...' })
```

## Installation

```shell
yarn add @sphereon/ssi-sdk-ext.did-provider-oyd
```

## Build

```shell
yarn build
```

## REST API Endpoints for `did:oyd`

For managing did:oyd DIDs (create, update, delete), refer to the following page, which provides detailed information on the available REST API endpoints: https://github.com/OwnYourData/oydid/tree/main/uni-registrar-driver-did-oyd
