<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>W3C VC API  
  <br>
</h1>

---

**Warning: This package is in early development. Breaking changes without notice will happen at this point!**

---

This module provides a W3C Verifiable Credential API, to allow issuance and verification of VCs and VPs.

# VC API

For more information about the W3C VC API visit
the [W3C VC API Github](https://w3c-ccg.github.io/vc-api/).
This module allows you to issue, persist, retrieve and verify Verifiable Credentials (other endpoints are not supported yet)

There are 3 modes of resolution, controlled by a query parameter, when calling the resolution endpoint. You can also set
a default mode when no query parameter is being used.

The modes are:

- **local**: Only DIDs managed by the agent can be resolved. DID:web and it's keys are translated to DID documents
- **global**: Resolves DIDs by using the supported resolvers of the agent, allowing external DID resolution
- **hybrid** (default): Tries to resolve locally first. If not found it will fallback to the global mode

### Issuance example

The below example resolves the provided did:web DID using external resolution by looking up the domain from the provided
host at https://ddip.sphereon.com.

```shell
curl -X POST\
-H "Accept: application/json"\
"https://agent/credentials/issue"
-d '<json body below>'
```

Body:

```json
{
  "attestationCredential": {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "id": "https://example.com/8790171",
    "type": ["VerifiableCredential", "GS1CompanyPrefixLicenseCredential"],
    "issuer": "did:web:example.com",
    "issuanceDate": "2023-06-22T00:00:00.000Z",
    "validUntil": "2024-06-22T00:00:00.000Z",
    "credentialSubject": {
      "id": "did:web:subject.example.com",
      "example": "value"
    },
    "proof": {
      "type": "JsonWebSignature2020",
      "created": "2023-06-29T22:20:27.000Z",
      "proofPurpose": "assertionMethod",
      "verificationMethod": "did:web:example.com#key-1",
      "jws": "ey......."
    }
  }
}
```

```json
{}
```

## Configure API

You can configure and build the API in multiple ways. This module also exposes functions for every endpoint, so you are
able to create your own Express router and then use functions to enable certain endpoints in your solution. The more
easy route is to use the `PublicKeyHosting` class. This class has configuration support, allowing to enable/disable
certain features, like for instance whether VCs can be created, persisted, and/or verified.

Note: You can have multiple instances of the PublicKeyHosting, as long as you make sure that the basePaths differs
for each instance and that the same express is being used.

```typescript
// agent is a configured SSI-SDK/Veramo agent (see below for an example)

// Let's first build express to listen on port 5000
const expressBuilder = ExpressBuilder.fromServerOpts({
  port: 5000,
  hostname: '0.0.0.0',
}).withPassportAuth(false)
const expressArgs = expressBuilder.build({ startListening: true })

// Now create the VC PI, with VC issuance, persistence and verification enabled and authentication disabled
new PublicKeyHosting({
  opts: {
    endpointOpts: {
      globalAuth: {
        authentication: {
          enabled: false,
        },
      },
    },
    issueCredentialOpts: {
      enableFeatures: ['attestationCredential-issue', 'attestationCredential-persist', 'attestationCredential-verify'],
      proofFormat: 'lds', // Issue JSON-LD VCs, can also be changed to `jwt`
      fetchRemoteContexts: true, // Whether to allow fetching remote contexts, mainly used when verifying VCs
      keyRef: '89a4661e446b46401325a38d3b20582d1dd277eb448a3181012a671b7ae15837', // The key to use when signing VCs
    },
  },
  expressArgs,
  agent,
})
// At this point you can execute the example above, as the VC API is now listening on port 5000
```

## Requirements

For this plugin a DID resolver is also required. A DID resolver can be added to the agent as plugin as seen in the
example below. You can find resolvers in the Veramo project and our
[SSI-SDK-crypto-extensions](https://github.com/Sphereon-Opensource/SSI-SDK-crypto-extensions.git)

### Agent setup

```typescript
export const resolver = new Resolver({
  ...getDidWebResolver(),
  ...getDidKeyResolver(),
  ...getDidJwkResolver(),
  ...getDidIonResolver(),
})

export const didProviders = {
  [`did:web`]: new WebDIDProvider({
    defaultKms: 'local',
  }),
  [`did:key`]: new KeyDIDProvider({
    defaultKms: 'local',
  }),
  [`did:ion`]: new IonDIDProvider({
    defaultKms: 'local',
  }),
  [`did:jwk`]: new JwkDIDProvider({
    defaultKms: 'local',
  }),
}

const agent = createAgent<
  IDIDManager &
    IKeyManager &
    IDataStore &
    IDataStoreORM &
    IResolver &
    IPresentationExchange &
    ICredentialVerifier &
    ICredentialHandlerLDLocal &
    ICredentialPlugin
>({
  plugins: [
    new DataStore(dbConnection),
    new DataStoreORM(dbConnection),
    new KeyManager({
      store: new KeyStore(dbConnection),
      kms: {
        local: new KeyManagementSystem(privateKeyStore),
      },
    }),
    new DIDManager({
      store: new DIDStore(dbConnection),
      defaultProvider: `${DID_PREFIX}:${SupportedDidMethodEnum.DID_JWK}`,
      providers: didProviders,
    }),
    new DIDResolverPlugin({
      resolver,
    }),
    new PresentationExchange(),
    new CredentialPlugin(),
    new CredentialHandlerLDLocal({
      contextMaps: [LdDefaultContexts],
      suites: [
        new SphereonEd25519Signature2018(),
        new SphereonEd25519Signature2020(),
        new SphereonBbsBlsSignature2020(),
        new SphereonJsonWebSignature2020(),
        new SphereonEcdsaSecp256k1RecoverySignature2020(),
      ],
      bindingOverrides: new Map([
        ['createVerifiableCredentialLD', MethodNames.createVerifiableCredentialLDLocal],
        ['createVerifiablePresentationLD', MethodNames.createVerifiablePresentationLDLocal],
      ]),
      keyStore: privateKeyStore,
    }),
  ],
})
```

## Installation

```shell
pnpm add @sphereon/ssi-sdk.w3c-attestationCredential-api
```

## Build

```shell
pnpm build
```
