<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>Universal resolver/registrar and DID Web CoseCryptoService  
  <br>
</h1>

---

**Warning: This package is in early development. Breaking changes without notice will happen at this point!**

---

This module provides a DIF Universal Resolver and Universal Registrar API, to allow DIDs managed by the agent to be
resolved using standardized APIs, as well as to create and manage new DIDs using the registrar APIs.

It also provides a means to host did:web documents directly from the agent. Meaning you can
access https://your-agent/.well-known/did.json or https://your-agent/sub/path1/did.json with the matching DID web in
your agent. This is handy when you either are managing your DID:web from the agent, or when managing custodial DID:web
documents for others.

# Universal Resolver & Registrar

For more information about the Universal Resolver visit
the [DIF Universal Resolver Github](https://github.com/decentralized-identity/universal-resolver).
This module allows you to expose all DIDs managed by the agent to be resolved from an API that is compatible with the
DIF Universal Resolver. It can also resolve non agent managed DIDs, as long as the agent has the appropriate DID
resolution plugin enabled.

## Universal Resolver

There are 3 modes of resolution, controlled by a query parameter, when calling the resolution endpoint. You can also set
a default mode when no query parameter is being used.

The modes are:

- **local**: Only DIDs managed by the agent can be resolved. DID:web and it's keys are translated to DID documents
- **global**: Resolves DIDs by using the supported resolvers of the agent, allowing external DID resolution
- **hybrid** (default): Tries to resolve locally first. If not found it will fallback to the global mode

### Resolution example

The below example resolves the provided did:web DID using external resolution by looking up the domain from the provided
host at https://ddip.sphereon.com.

```shell
curl -X GET\
-H "Accept: application/did+ld+json,application/ld+json;profile="https://w3id.org/did-resolution",application/did+json"\
"https://agent/1.0/identifiers/did:web:ddip.sphereon.com?mode=global"
```

```json
{
  "didDocumentMetadata": {},
  "didResolutionMetadata": {
    "contentType": "application/did+ld+json"
  },
  "didDocument": {
    "@context": "https://w3id.org/did/v1",
    "id": "did:web:ddip.sphereon.com",
    "verificationMethod": [
      {
        "id": "did:web:ddip.sphereon.com#JWK2020-RSA",
        "type": "JsonWebKey2020",
        "controller": "did:web:ddip.sphereon.com",
        "publicKeyJwk": {
          "kty": "RSA",
          "n": "upER2p4nue8mrJOau6ZPaazYgYlPpPwk4pDuG-jbWSxMU74beUfHxESyaXcgmjTLuQfn7yrjxt67xFTOwaKEIx1f51GhXtOxqmnTWCfWBMFCYlTnEb2oxyMHVUI9dmJcmaaKMBTNDmvCRpHCbioetXDfC_3GNqBjbF-_GOAknNiKHhclyfDzGtyQWNQueEPfAiIPQc3d3-HnlwlNfav_f1VvDlcbJ4xzjMk6N_qCyLJsbDRQqqZJJOfxfjipdbMYBqYEcXPDSmdzkT6scckqXgdLelRftx4O3nzDqnyrv8PA2kKBRRqCymrYK1Vaq7uk6JQA6w5MgN7mekVpkrXQqw",
          "e": "AQAB",
          "x5u": "https://ddip.sphereon.com/.well-known/ca-bundle.cert"
        }
      }
    ],
    "authentication": ["did:web:ddip.sphereon.com#JWK2020-RSA"],
    "assertionMethod": ["did:web:ddip.sphereon.com#JWK2020-RSA"],
    "service": []
  }
}
```

## Registration Example

The below example creates a did:web. For did:web you will always have to provide the actual DID value, so the agent can
store the keys and associate them with this DID. The below example creates a did:web:localhost:example:path:test,
meaning the DID would need to be hosted at https://localhost/example/path/test/did.json (see also DID Web CoseCryptoService,
below).

For certain DID methods the did body property is required, like did:web, optional or not allowed. When it is optional
typically you will have to provide it if you would also be providing public or private keys, and this know what the
eventual DID will become (not supported yet). When you let the registrar create key(s), you might not know the 'did'
value yet, and thus it can be omitted.

```shell
curl -X POST\
-H "Accept: application/json"\
-H "Content-Type: application/json"\
-d '{
  "did": "did:web:localhost:example:path:test",
    "options": {
        "storeSecrets": true
    }
}'\
"http://agent/1.0/identifiers?method=web"
```

```json
{
  "jobId": "a01a8bc2-971f-4720-b835-981eaa5bf90e",
  "didState": {
    "did": "did:web:localhost:example:path:test",
    "state": "finished",
    "didDocument": {
      "@context": "https://www.w3.org/ns/did/v1",
      "id": "did:web:localhost:example:path:test",
      "verificationMethod": [
        {
          "controller": "did:web:localhost:example:path:test",
          "id": "did:web:localhost:example:path:test#042b4fa9f7378e1594b0b9350b380ba80f2457433df0376d37abc049863f20848fa863e3e843232a21d6b6b3a36cd52a8fac17294bebcf24d95cc422c7c0ae67da",
          "publicKeyJwk": {
            "alg": "ES256K",
            "use": "sig",
            "kty": "EC",
            "crv": "secp256k1",
            "x": "K0-p9zeOFZSwuTULOAuoDyRXQz3wN203q8BJhj8ghI8",
            "y": "qGPj6EMjKiHWtrOjbNUqj6wXKUvrzyTZXMQix8CuZ9o"
          },
          "type": "JsonWebKey2020"
        }
      ],
      "assertionMethod": [
        "did:web:localhost:example:path:test#042b4fa9f7378e1594b0b9350b380ba80f2457433df0376d37abc049863f20848fa863e3e843232a21d6b6b3a36cd52a8fac17294bebcf24d95cc422c7c0ae67da"
      ],
      "authentication": [
        "did:web:localhost:example:path:test#042b4fa9f7378e1594b0b9350b380ba80f2457433df0376d37abc049863f20848fa863e3e843232a21d6b6b3a36cd52a8fac17294bebcf24d95cc422c7c0ae67da"
      ],
      "keyAgreement": [],
      "service": []
    }
  }
}
```

## Configure API

You can configure and build the API in multiple ways. This module also exposes functions for every endpoint, so you are
able to create your own Express router and then use functions to enable certain endpoints in your solution. The more
easy route is to use the UniResolverServer class. This class has configuration support, allowing to enable/disable
certain features, like for instance whether DIDs can be created/persisted or not (Universal Registrar), and whether
resolution is
enabled or not. If you want to have the agent provide its resolution endpoint at exactly the same endpoint route,
please make sure to set the basePath to '/1.0', then the resolution endpoint
becomes http://agent/1.0/identifiers/did:example:123, which could easily be TLS terminated by using a reverse proxy or
load-balancer in front of it.

In order to enable Universal Registrar support, make sure to enable the 'did-persist' feature.

Note: You can have multiple instances of the UniResolverApiServer, as long as you make sure that the basePaths differs
for each instance and that the same express is being used.

```typescript
// agent is a configured SSI-SDK/Veramo agent (see below for an example)

// Let's first build express to listen on port 5000
const expressBuilder = ExpressBuilder.fromServerOpts({
  port: 5000,
  hostname: '0.0.0.0',
}).withPassportAuth(false)
const expressArgs = expressBuilder.build({ startListening: true })

// Now create the Universal Resolver API, with DID resolution and persistence enabled and authentication disabled
new UniResolverApiServer({
  opts: {
    enableFeatures: ['did-persist', 'did-resolve'],
    endpointOpts: {
      basePath: '/1.0', // Let's make sure the eventual path becomes <agent>/1.0/idenfitiers/<did>
      globalAuth: {
        authentication: {
          enabled: false,
        },
      },
    },
  },
  expressArgs,
  agent,
})
// At this point you can execute the example above, as the Uniresolver is now listening on port 5000
```

## DID Web CoseCryptoService

This service hosts agent managed did:web DIDs at the appropriate locations as a did.json file. Meaning that whenever you hit
https://agent/.well-known/did.json or http://agent/example/path/test/did.json for instance, the agent will lookup the appropriate DID managed by the agent.
If no DID is found for the URL, it will return the below response, with an HTTP code 404

```json
{
  "error": "Not found"
}
```

If a DID is found it will return the DID Document (not a resolution result)

```json
{
  "@context": "https://www.w3.org/ns/did/v1",
  "id": "did:web:localhost:example:path:test",
  "verificationMethod": [
    {
      "controller": "did:web:localhost:example:path:test",
      "id": "did:web:localhost:example:path:test#042b4fa9f7378e1594b0b9350b380ba80f2457433df0376d37abc049863f20848fa863e3e843232a21d6b6b3a36cd52a8fac17294bebcf24d95cc422c7c0ae67da",
      "publicKeyJwk": {
        "alg": "ES256K",
        "use": "sig",
        "kty": "EC",
        "crv": "secp256k1",
        "x": "K0-p9zeOFZSwuTULOAuoDyRXQz3wN203q8BJhj8ghI8",
        "y": "qGPj6EMjKiHWtrOjbNUqj6wXKUvrzyTZXMQix8CuZ9o"
      },
      "type": "JsonWebKey2020"
    }
  ],
  "assertionMethod": [
    "did:web:localhost:example:path:test#042b4fa9f7378e1594b0b9350b380ba80f2457433df0376d37abc049863f20848fa863e3e843232a21d6b6b3a36cd52a8fac17294bebcf24d95cc422c7c0ae67da"
  ],
  "authentication": [
    "did:web:localhost:example:path:test#042b4fa9f7378e1594b0b9350b380ba80f2457433df0376d37abc049863f20848fa863e3e843232a21d6b6b3a36cd52a8fac17294bebcf24d95cc422c7c0ae67da"
  ],
  "keyAgreement": [],
  "service": []
}
```

## Requirements

For this plugin a DID resolver is also required. A DID resolver can be added to the agent as plugin as seen in the
example below. Please note you will need to add DID providers and resolvers from Veramo and our
[SSI-SDK-crypto-extensions](https://github.com/Sphereon-Opensource/SSI-SDK-crypto-extensions.git), in order to support
these DID methods.

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

const agent = createAgent<IDIDManager & IKeyManager & IDataStore & IDataStoreORM & IResolver>({
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
      defaultProvider: 'did:jwk',
      providers: didProviders,
    }),
    new DIDResolverPlugin({
      resolver,
    }),
  ],
})
```

## Installation

```shell
pnpm add @sphereon/ssi-sdk.uni-resolver-registrar-api
```

## Build

```shell
pnpm build
```
