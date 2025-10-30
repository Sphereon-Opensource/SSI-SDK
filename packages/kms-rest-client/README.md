<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>KMS REST Client
  <br>
</h1>

---

**Warning: This package still is in very early development. Breaking changes without notice will happen at this point!**

---

# ssi-sdk.kms-rest-client

A SSI-SDK plugin with types/interfaces and utility functions for calling rest endpoints of a KMS

## Available functions

- kmsClientGetResolver
- kmsClientListResolvers
- kmsClientResolveKey
- kmsClientCreateRawSignature
- kmsClientIsValidRawSignature
- kmsClientGetKey
- kmsClientListKeys
- kmsClientStoreKey
- kmsClientGenerateKey
- kmsClientDeleteKey
- kmsClientGetKeyProvider
- kmsClientListKeyProviders
- kmsClientProviderListKeys
- kmsClientProviderStoreKey
- kmsClientProviderGenerateKey
- kmsClientProviderGetKey
- kmsClientProviderDeleteKey

### Adding the plugin to an agent:

```typescript
import { KmsRestClient } from '@sphereon/ssi-sdk.kms-rest-client'

const agent = createAgent<IKmsRestClient>({
  plugins: [
    new KmsRestClient({
      baseUrl: 'my-issuer-base-url',
    }),
  ],
})
```

## Usage

### Getting a resolver:

```typescript
const resolver = await agent.kmsClientGetResolver({
  baseUrl: 'https://ssi-backend.sphereon.com',
  resolverId: 'jose_cose_resolver',
})
```

### List resolvers

```typescript
const resolvers = await agent.kmsClientListResolvers({
  baseUrl: 'https://ssi-backend.sphereon.com',
})
```

### Resolve key

```typescript
const resolvedKey = await agent.kmsClientResolveKey({
  baseUrl: 'https://ssi-backend.sphereon.com',
  resolverId: 'jose_cose_resolver',
  keyInfo: {
    key: {
      kty: 'EC',
      kid: 'HAnuRAJHmahYSmnfcmX9lF25bRsi_IWoFkJ2KueEXOU',
      use: 'sig',
      keyOps: ['sign'],
      crv: 'P-256',
      x: 'DwRiRyvtMXhFwCKuoAMnpviMmrE1B0Fu44_LeQEycEs',
      y: '3BnhvdB6QYGp7x9Ey7qW_TNZ0MI0hNZgLlyl6rbxln8',
      d: 'xVjyhcZDnLR3zJcuMMlQjXlNGDz3hxS0_aCoDd8P9XY',
    },
    alias: 'HAnuRAJHmahYSmnfcmX9lF25bRsi_IWoFkJ2KueEXOU',
    providerId: 'provider-id',
    kid: 'HAnuRAJHmahYSmnfcmX9lF25bRsi_IWoFkJ2KueEXOU',
    signatureAlgorithm: 'ECDSA_SHA256',
    keyVisibility: 'PRIVATE',
    keyType: 'EC',
    keyEncoding: 'JOSE',
  },
})
```

### Create signature

```typescript
const signature = await agent.kmsClientCreateRawSignature({
  baseUrl: 'https://ssi-backend.sphereon.com',
  keyInfo: {
    key: {
      kty: 'EC',
      kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
      use: 'sig',
      keyOps: ['sign'],
      crv: 'P-256',
      x: 'HFL67WWh6PYWKOy1mzt9Y2ANs-CWFIyVtouR-Jx_mAM',
      y: '9f_1x7fwUuEbEwxSNTYE3jQF-zForWpKkEMpiUp1MNI',
      d: 'P_4YEyuDj4aA4IVYVku4dm3BoDReFTKVsBwb1utoWCQ',
    },
    kid: '7KYAtmhlRu4M5k5Uv9-jV3XKgRc8wpzJYKg3l89LkGQ',
    alias: 'Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4',
    providerId: 'test-software',
    signatureAlgorithm: 'ECDSA_SHA256',
    keyVisibility: 'PUBLIC',
    x5c: ['1', '2'],
    keyEncoding: 'JOSE',
    opts: {
      test: 'test',
    },
    keyType: 'EC',
  },
  input: 'aGVsbG8=',
})
```

### Verify signature

```typescript
const verification = await agent.kmsClientIsValidRawSignature({
  baseUrl: 'https://ssi-backend.sphereon.com',
  keyInfo: {
    key: {
      kty: 'EC',
      kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
      use: 'sig',
      keyOps: ['sign'],
      crv: 'P-256',
      x: 'HFL67WWh6PYWKOy1mzt9Y2ANs-CWFIyVtouR-Jx_mAM',
      y: '9f_1x7fwUuEbEwxSNTYE3jQF-zForWpKkEMpiUp1MNI',
      d: 'P_4YEyuDj4aA4IVYVku4dm3BoDReFTKVsBwb1utoWCQ',
    },
    kid: '7KYAtmhlRu4M5k5Uv9-jV3XKgRc8wpzJYKg3l89LkGQ',
    alias: 'Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4',
    providerId: 'test-software',
    signatureAlgorithm: 'ECDSA_SHA256',
    keyVisibility: 'PUBLIC',
    x5c: ['1', '2'],
    keyEncoding: 'JOSE',
    opts: {
      test: 'test',
    },
    keyType: 'EC',
  },
  input: 'aGVsbG8=',
  signature: 'RrTEoBb/3KQSEiCYnrTizM4O7qWeY5cNQYlQYl4pLMZKyLBYaoU1uxzmwLMFAIfnwA41mMTyLZlG4JG0zCm9iA==',
})
```

### Get key

```typescript
const key = await agent.kmsClientGetKey({
  baseUrl: 'https://ssi-backend.sphereon.com',
  aliasOrKid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
})
```

### List keys

```typescript
const keys = await agent.kmsClientListKeys({
  baseUrl: 'https://ssi-backend.sphereon.com',
})
```

### Store key

```typescript
const key = await agent.kmsClientStoreKey({
  baseUrl: 'https://ssi-backend.sphereon.com',
  keyInfo: {
    key: {
      kty: 'EC',
      kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
      use: 'sig',
      keyOps: ['sign'],
      crv: 'P-256',
      x: 'HFL67WWh6PYWKOy1mzt9Y2ANs-CWFIyVtouR-Jx_mAM',
      y: '9f_1x7fwUuEbEwxSNTYE3jQF-zForWpKkEMpiUp1MNI',
      d: 'P_4YEyuDj4aA4IVYVku4dm3BoDReFTKVsBwb1utoWCQ',
    },
    kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
    alias: 'Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4',
    providerId: 'provider-id',
    signatureAlgorithm: 'ECDSA_SHA256',
    keyVisibility: 'PUBLIC',
    x5c: ['1', '2'],
    keyEncoding: 'JOSE',
    opts: {
      test: 'test',
    },
    keyType: 'EC',
  },
  certChain: [
    'MIIByTCCAW6gAwIBAgIQF+SpO+EPJj42boA4WHPL2zAKBggqhkjOPQQDAjBAMT4wPAYDVQQDEzVBY2MgS2l3YSBEaWdpdGFsIENlcnRpZmljYXRpb24gV2FsbGV0IEludGVybWVkaWF0ZSBDQTAeFw0yNTA2MjUxMzA4MzJaFw0yNjA2MjUxMzA4MzJaMDYxNDAyBgNVBAMTK3dhbGxldC02NDA2MzA3OS02ZmM3LTRhZTgtOWEwMi0yNTE4YTRhYmQyZmIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASnaLC4eYSs/8XkDz8rDANemjmyI+N5g0yIJIiScgCnjZogmlDGGQ8HYCdvs9SJJJ3c17YSax44vVl6LMnidvKno1QwUjAJBgNVHRMEAjAAMB0GA1UdDgQWBBRI7w4/H9JCty7T4aVl+im74XEV0zAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwCgYIKoZIzj0EAwIDSQAwRgIhAPnLEppg5TGMCqp/Nn+2os6vupEclyKv1yk/JQFQME8TAiEAiYrVm/6J8zGmhtiG958kZB0afXhM/i3DuY8+0kpTUzA=',
    'MIIByTCCAW6gAwIBAgIQF+SpO+EPJj42boA4WHPL2zAKBggqhkjOPQQDAjBAMT4wPAYDVQQDEzVBY2MgS2l3YSBEaWdpdGFsIENlcnRpZmljYXRpb24gV2FsbGV0IEludGVybWVkaWF0ZSBDQTAeFw0yNTA2MjUxMzA4MzJaFw0yNjA2MjUxMzA4MzJaMDYxNDAyBgNVBAMTK3dhbGxldC02NDA2MzA3OS02ZmM3LTRhZTgtOWEwMi0yNTE4YTRhYmQyZmIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASnaLC4eYSs/8XkDz8rDANemjmyI+N5g0yIJIiScgCnjZogmlDGGQ8HYCdvs9SJJJ3c17YSax44vVl6LMnidvKno1QwUjAJBgNVHRMEAjAAMB0GA1UdDgQWBBRI7w4/H9JCty7T4aVl+im74XEV0zAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwCgYIKoZIzj0EAwIDSQAwRgIhAPnLEppg5TGMCqp/Nn+2os6vupEclyKv1yk/JQFQME8TAiEAiYrVm/6J8zGmhtiG958kZB0afXhM/i3DuY8+0kpTUzA=',
  ],
})
```

### Generate key

```typescript
const key = await agent.kmsClientGenerateKey({
  baseUrl: 'https://ssi-backend.sphereon.com',
  use: 'sig',
  alg: 'ECDSA_SHA256',
  keyOperations: ['sign'],
})
```

### Delete key

```typescript
const result = await agent.kmsClientDeleteKey({
  baseUrl: 'https://ssi-backend.sphereon.com',
  aliasOrKid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
})
```

### Get provider

```typescript
const provider = await agent.kmsClientGetKeyProvider({
  baseUrl: 'https://ssi-backend.sphereon.com',
  providerId: 'provider-id',
})
```

### List providers

```typescript
const providers = await agent.kmsClientListKeyProviders({
  baseUrl: 'https://ssi-backend.sphereon.com',
})
```

### List providers

```typescript
const providers = await agent.kmsClientListKeyProviders({
  baseUrl: 'https://ssi-backend.sphereon.com',
})
```

### List provider keys

```typescript
const keys = await agent.kmsClientProviderListKeys({
  baseUrl: 'https://ssi-backend.sphereon.com',
  providerId: 'provider-id',
})
```

### Store provider key

```typescript
const key = await agent.kmsClientProviderStoreKey({
  baseUrl: 'https://ssi-backend.sphereon.com',
  providerId: 'provider-id',
  keyInfo: {
    key: {
      kty: 'EC',
      kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
      use: 'sig',
      keyOps: ['sign'],
      crv: 'P-256',
      x: 'HFL67WWh6PYWKOy1mzt9Y2ANs-CWFIyVtouR-Jx_mAM',
      y: '9f_1x7fwUuEbEwxSNTYE3jQF-zForWpKkEMpiUp1MNI',
      d: 'P_4YEyuDj4aA4IVYVku4dm3BoDReFTKVsBwb1utoWCQ',
    },
    kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
    alias: 'Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4',
    providerId: 'test-software',
    signatureAlgorithm: 'ECDSA_SHA256',
    keyVisibility: 'PUBLIC',
    x5c: ['1', '2'],
    keyEncoding: 'JOSE',
    opts: {
      test: 'test',
    },
    keyType: 'EC',
  },
  certChain: [
    'MIIByTCCAW6gAwIBAgIQF+SpO+EPJj42boA4WHPL2zAKBggqhkjOPQQDAjBAMT4wPAYDVQQDEzVBY2MgS2l3YSBEaWdpdGFsIENlcnRpZmljYXRpb24gV2FsbGV0IEludGVybWVkaWF0ZSBDQTAeFw0yNTA2MjUxMzA4MzJaFw0yNjA2MjUxMzA4MzJaMDYxNDAyBgNVBAMTK3dhbGxldC02NDA2MzA3OS02ZmM3LTRhZTgtOWEwMi0yNTE4YTRhYmQyZmIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASnaLC4eYSs/8XkDz8rDANemjmyI+N5g0yIJIiScgCnjZogmlDGGQ8HYCdvs9SJJJ3c17YSax44vVl6LMnidvKno1QwUjAJBgNVHRMEAjAAMB0GA1UdDgQWBBRI7w4/H9JCty7T4aVl+im74XEV0zAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwCgYIKoZIzj0EAwIDSQAwRgIhAPnLEppg5TGMCqp/Nn+2os6vupEclyKv1yk/JQFQME8TAiEAiYrVm/6J8zGmhtiG958kZB0afXhM/i3DuY8+0kpTUzA=',
    'MIIByTCCAW6gAwIBAgIQF+SpO+EPJj42boA4WHPL2zAKBggqhkjOPQQDAjBAMT4wPAYDVQQDEzVBY2MgS2l3YSBEaWdpdGFsIENlcnRpZmljYXRpb24gV2FsbGV0IEludGVybWVkaWF0ZSBDQTAeFw0yNTA2MjUxMzA4MzJaFw0yNjA2MjUxMzA4MzJaMDYxNDAyBgNVBAMTK3dhbGxldC02NDA2MzA3OS02ZmM3LTRhZTgtOWEwMi0yNTE4YTRhYmQyZmIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASnaLC4eYSs/8XkDz8rDANemjmyI+N5g0yIJIiScgCnjZogmlDGGQ8HYCdvs9SJJJ3c17YSax44vVl6LMnidvKno1QwUjAJBgNVHRMEAjAAMB0GA1UdDgQWBBRI7w4/H9JCty7T4aVl+im74XEV0zAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwCgYIKoZIzj0EAwIDSQAwRgIhAPnLEppg5TGMCqp/Nn+2os6vupEclyKv1yk/JQFQME8TAiEAiYrVm/6J8zGmhtiG958kZB0afXhM/i3DuY8+0kpTUzA=',
  ],
})
```

### Generate provider key

```typescript
const key = await agent.kmsClientProviderGenerateKey({
  baseUrl: 'https://ssi-backend.sphereon.com',
  providerId: 'provider-id',
  use: 'sig',
  alg: 'ECDSA_SHA256',
  keyOperations: ['sign'],
})
```

### Get provider key

```typescript
const key = await agent.kmsClientProviderGetKey({
  baseUrl: 'https://ssi-backend.sphereon.com',
  providerId: 'provider-id',
  aliasOrKid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
})
```

### Delete provider key

```typescript
const result = await agent.kmsClientProviderDeleteKey({
  baseUrl: 'https://ssi-backend.sphereon.com',
  providerId: 'provider-id',
  aliasOrKid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
})
```

### Installation

```shell
yarn add @sphereon/ssi-sdk.kms-rest-client
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
