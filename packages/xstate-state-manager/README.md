<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>JSON-LD VC Handler Local (Typescript + React-Native) 
  <br>
</h1>

---

**Warning: This package still is in every early development. Breaking changes without notice will happen at this point!**

---

# vc-handler-ld-local

A Veramo plugin to issue and verify JSON-LD based credentials and presentations using a react-native capable port of Digital Bazaars VC library.

### Installation

```shell
yarn add @sphereon/ssi-sdk.vc-handler-ld-local
```

### Build

```shell
yarn build
```

### Test

The test command runs:

- `prettier`
- `jest`
- `coverage`

You can also run only a single section of these tests, using for example `yarn test:unit`.

```shell
yarn test
```

### Utility scripts

There are other utility scripts that help with development.

- `yarn fix` - runs `eslint --fix` as well as `prettier` to fix code style.

### Agent setup

```typescript
constructor(connection: Promise<Connection>) {
    const privateKeyStore = new PrivateKeyStore(connection, new SecretBox(KMS_SECRET_KEY))
    this._agent = createAgent<
      ICredentialHandlerLDLocal & IDIDManager & IKeyManager & IDataStore & IDataStoreORM & IResolver
    >({
      plugins: [
        new BlsKeyManager({
          store: new KeyStore(connection),
          kms: {
            local: new BlsKeyManagementSystem(privateKeyStore),
          },
        }),
        new DIDManager({
          store: new DIDStore(connection),
          defaultProvider: 'did:key',
          providers: {
            'did:key': new BlsKeyDidProvider({
              defaultKms: 'local',
            }),
          },
        }),
        new CredentialIssuer(),
        new CredentialHandlerLDLocal({
          contextMaps: [LdDefaultContexts],
          suites: [new SphereonEd25519Signature2018(), new SphereonEd25519Signature2020(), new SphereonBbsBlsSignature2020()],
          keyStore: privateKeyStore
        }),
        new DIDResolverPlugin({
          resolver: new Resolver({
            ...keyDidResolver()
          }),
        }),
      ],
    });
  }
```

- To support BLS+, the @sphereon/bls-\* plugins must be used, otherwise only Ed25519 plugins will be supported.

### Issue Verifiable Credentials using the Veramo agent:

Ed25519

```typescript
agent.createVerifiableCredentialLDLocal({
  credential: {
    issuer: 'did:key:z6MkkDYR2LLa6tDBXVEuxcU4pqvHggz36oQESE9fc9jK6mAt',
    credentialSubject: {
      id: 'did:key:z6MkkDYR2LLa6tDBXVEuxcU4pqvHggz36oQESE9fc9jK6mAt',
    },
  },
})
```

BBS+

```typescript
agent.createVerifiableCredentialLDLocal({
  credential: {
    issuer:
      'did:key:zUC7Gc59EawPuAbe1gcbmpTtYeyRvRLUsCfkmHwmNaiQyQtQp9f4G4KHurpHaa6QUvm1mL1rZvKXQWpfRcTBfLsstL2kmMN3rkFSzYuzbxwD4LespdY8NKdsghxeiRNtNSbzKic',
    credentialSubject: {
      id: 'did:key:zUC7Gc59EawPuAbe1gcbmpTtYeyRvRLUsCfkmHwmNaiQyQtQp9f4G4KHurpHaa6QUvm1mL1rZvKXQWpfRcTBfLsstL2kmMN3rkFSzYuzbxwD4LespdY8NKdsghxeiRNtNSbzKic',
    },
    '@context': ['https://w3id.org/security/bbs/v1'],
  },
  keyRef:
    'ad80e96c1f45ab12acc3064de578a5fe9737cd09459257b8abb56058199ef06ca04455ed3714ec30b9f50c186a7cfcb502d3469ae9458e2d3d1a0bf8a58215b0e23ad9620b9a961d0a0cd5484b8539efdce49d018508addbf099cf63f96bdd5d',
})
```

### Verify a Verifiable Credential using Veramo agent:

Ed25519

```typescript
agent.verifyCredentialLDLocal({
  credential: {
    issuer: 'did:key:z6MkkDYR2LLa6tDBXVEuxcU4pqvHggz36oQESE9fc9jK6mAt',
    credentialSubject: {
      id: 'did:key:z6MkkDYR2LLa6tDBXVEuxcU4pqvHggz36oQESE9fc9jK6mAt',
    },
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuanceDate: '2022-08-23T13:26:14.712Z',
    proof: {
      type: 'Ed25519Signature2018',
      created: '2022-08-23T13:26:14Z',
      verificationMethod: 'did:key:z6MkkDYR2LLa6tDBXVEuxcU4pqvHggz36oQESE9fc9jK6mAt#z6MkkDYR2LLa6tDBXVEuxcU4pqvHggz36oQESE9fc9jK6mAt',
      proofPurpose: 'assertionMethod',
      jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..o9mN0c6Ax-YmAIPz6_kQb2IA_HtKkfFn1H1LFHfexsoznFmIeEL0azh3oo8iYVrAa674dgLSvlHn8Q6iXAi_DA',
    },
  },
  fetchRemoteContexts: true,
})
```

BBS+

```typescript
agent.verifyCredentialLDLocal({
  credential: {
    issuer:
      'did:key:zUC7Gc59EawPuAbe1gcbmpTtYeyRvRLUsCfkmHwmNaiQyQtQp9f4G4KHurpHaa6QUvm1mL1rZvKXQWpfRcTBfLsstL2kmMN3rkFSzYuzbxwD4LespdY8NKdsghxeiRNtNSbzKic',
    credentialSubject: {
      id: 'did:key:zUC7Gc59EawPuAbe1gcbmpTtYeyRvRLUsCfkmHwmNaiQyQtQp9f4G4KHurpHaa6QUvm1mL1rZvKXQWpfRcTBfLsstL2kmMN3rkFSzYuzbxwD4LespdY8NKdsghxeiRNtNSbzKic',
    },
    '@context': ['https://www.w3.org/2018/credentials/v1', 'https://w3id.org/security/bbs/v1'],
    type: ['VerifiableCredential'],
    issuanceDate: '2022-08-23T09:59:03.522Z',
    proof: {
      type: 'BbsBlsSignature2020',
      created: '2022-08-23T09:59:03Z',
      proofPurpose: 'assertionMethod',
      proofValue:
        'uLSsfDEFXea0yybm6i28/TrnDaoUc4hwweLqjwe4dbtvSZk+WlsKIyJoXZa2d8doD7cw8zOe8wTnwvZje4LxlNISsdfT6TWQy2O7toRWWXxqC3L2qrrtc/TY1Pfgu8DvTpMahjH4bv9q+AUR/Mm6Tg==',
      verificationMethod:
        'did:key:zUC7Gc59EawPuAbe1gcbmpTtYeyRvRLUsCfkmHwmNaiQyQtQp9f4G4KHurpHaa6QUvm1mL1rZvKXQWpfRcTBfLsstL2kmMN3rkFSzYuzbxwD4LespdY8NKdsghxeiRNtNSbzKic#zUC7Gc59EawPuAbe1gcbmpTtYeyRvRLUsCfkmHwmNaiQyQtQp9f4G4KHurpHaa6QUvm1mL1rZvKXQWpfRcTBfLsstL2kmMN3rkFSzYuzbxwD4LespdY8NKdsghxeiRNtNSbzKic',
    },
  },
  fetchRemoteContexts: true,
})
```

### Request examples (Veramo REST API):

#### Issue Verifiable Credential

Ed25519:

```shell
POST http://localhost:7071/api/vdx-ivcs/v1/createVerifiableCredentialLDLocal

Content-Type: application/json

{
  "credential": {
    "issuer": "did:key:z6MkkDYR2LLa6tDBXVEuxcU4pqvHggz36oQESE9fc9jK6mAt",
    "credentialSubject": {
      "id": "did:key:z6MkkDYR2LLa6tDBXVEuxcU4pqvHggz36oQESE9fc9jK6mAt"
    }
  }
}
```

BBS+:

```shell
POST http://localhost:7071/api/vdx-ivcs/v1/createVerifiableCredentialLDLocal

Content-Type: application/json

{
  "credential": {
    "issuer": "did:key:zUC7Gc59EawPuAbe1gcbmpTtYeyRvRLUsCfkmHwmNaiQyQtQp9f4G4KHurpHaa6QUvm1mL1rZvKXQWpfRcTBfLsstL2kmMN3rkFSzYuzbxwD4LespdY8NKdsghxeiRNtNSbzKic",
    "credentialSubject": {
      "id": "did:key:zUC7Gc59EawPuAbe1gcbmpTtYeyRvRLUsCfkmHwmNaiQyQtQp9f4G4KHurpHaa6QUvm1mL1rZvKXQWpfRcTBfLsstL2kmMN3rkFSzYuzbxwD4LespdY8NKdsghxeiRNtNSbzKic"
    },
    "@context": ["https://w3id.org/security/bbs/v1"]
  },
  "keyRef": "ad80e96c1f45ab12acc3064de578a5fe9737cd09459257b8abb56058199ef06ca04455ed3714ec30b9f50c186a7cfcb502d3469ae9458e2d3d1a0bf8a58215b0e23ad9620b9a961d0a0cd5484b8539efdce49d018508addbf099cf63f96bdd5d"
}
```

- To generate a BBS+ VCs the [@context]("https://w3id.org/security/bbs/v1") and keyRef (kid) properties are needed

#### Verify a Verifiable Credential

Ed25519:

```shell
POST http://localhost:7071/api/vdx-ivcs/v1/verifyCredentialLDLocal

Content-Type: application/json
Accept: application/json

{
  "credential": {
    "issuer": "did:key:z6MkkDYR2LLa6tDBXVEuxcU4pqvHggz36oQESE9fc9jK6mAt",
    "credentialSubject": {
      "id": "did:key:z6MkkDYR2LLa6tDBXVEuxcU4pqvHggz36oQESE9fc9jK6mAt"
    },
    "@context": [
      "https://www.w3.org/2018/credentials/v1"
    ],
    "type": [
      "VerifiableCredential"
    ],
    "issuanceDate": "2022-08-23T13:26:14.712Z",
    "proof": {
      "type": "Ed25519Signature2018",
      "created": "2022-08-23T13:26:14Z",
      "verificationMethod": "did:key:z6MkkDYR2LLa6tDBXVEuxcU4pqvHggz36oQESE9fc9jK6mAt#z6MkkDYR2LLa6tDBXVEuxcU4pqvHggz36oQESE9fc9jK6mAt",
      "proofPurpose": "assertionMethod",
      "jws": "eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..o9mN0c6Ax-YmAIPz6_kQb2IA_HtKkfFn1H1LFHfexsoznFmIeEL0azh3oo8iYVrAa674dgLSvlHn8Q6iXAi_DA"
    }
  },
  "fetchRemoteContexts": true
}
```

BBS+

```shell
POST http://localhost:7071/api/vdx-ivcs/v1/verifyCredentialLDLocal

Content-Type: application/json
Accept: application/json

{
  "credential": {
    "issuer": "did:key:zUC7Gc59EawPuAbe1gcbmpTtYeyRvRLUsCfkmHwmNaiQyQtQp9f4G4KHurpHaa6QUvm1mL1rZvKXQWpfRcTBfLsstL2kmMN3rkFSzYuzbxwD4LespdY8NKdsghxeiRNtNSbzKic",
    "credentialSubject": {
      "id": "did:key:zUC7Gc59EawPuAbe1gcbmpTtYeyRvRLUsCfkmHwmNaiQyQtQp9f4G4KHurpHaa6QUvm1mL1rZvKXQWpfRcTBfLsstL2kmMN3rkFSzYuzbxwD4LespdY8NKdsghxeiRNtNSbzKic"
    },
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://w3id.org/security/bbs/v1"
    ],
    "type": [
      "VerifiableCredential"
    ],
    "issuanceDate": "2022-08-23T09:59:03.522Z",
    "proof": {
      "type": "BbsBlsSignature2020",
      "created": "2022-08-23T09:59:03Z",
      "proofPurpose": "assertionMethod",
      "proofValue": "uLSsfDEFXea0yybm6i28/TrnDaoUc4hwweLqjwe4dbtvSZk+WlsKIyJoXZa2d8doD7cw8zOe8wTnwvZje4LxlNISsdfT6TWQy2O7toRWWXxqC3L2qrrtc/TY1Pfgu8DvTpMahjH4bv9q+AUR/Mm6Tg==",
      "verificationMethod": "did:key:zUC7Gc59EawPuAbe1gcbmpTtYeyRvRLUsCfkmHwmNaiQyQtQp9f4G4KHurpHaa6QUvm1mL1rZvKXQWpfRcTBfLsstL2kmMN3rkFSzYuzbxwD4LespdY8NKdsghxeiRNtNSbzKic#zUC7Gc59EawPuAbe1gcbmpTtYeyRvRLUsCfkmHwmNaiQyQtQp9f4G4KHurpHaa6QUvm1mL1rZvKXQWpfRcTBfLsstL2kmMN3rkFSzYuzbxwD4LespdY8NKdsghxeiRNtNSbzKic"
    }
  },
  "fetchRemoteContexts": true
}
```
