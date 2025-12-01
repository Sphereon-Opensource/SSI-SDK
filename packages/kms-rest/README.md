<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>REST Key Management System Plugin
  <br>
</h1>

---

**Warning: This package still is in very early development. Breaking changes without notice will happen at this point!**

---

# ssi-sdk.kms-rest

This module provides a Key Management System (KMS) wrapper that enables the use of REST KMS functionalities within your application. It extends the capabilities of the AbstractKeyManagementSystem.

## Available functions

- createKey
- importKey
- deleteKey
- listKeys
- sign
- verify

### Installation

To install the module, use the following command:

```bash
yarn add @sphereon/ssi-sdk.kms-rest
```

## Usage

### Create key

```typescript
const key = await kms.createKey({ type: 'Secp256r1' })
```

### Import key

```typescript
const privateKeyHex = '7dd923e40f4615ac496119f7e793cc2899e99b64b88ca8603db986700089532b'
const key = await kms.importKey({ kid: 'kid', privateKeyHex, type: 'Secp256r1' })
```

### Delete key

```typescript
const result = await kms.deleteKey({ kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE' })
```

### List keys

```typescript
const keys = await kms.listKeys()
```

### Sign

```typescript
const signature = await kms.sign({
  keyRef: { kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE' },
  data: u8a.fromString('input', 'base64'),
})
```

### Verify signature

```typescript
const verification = await kms.verify({
  keyRef: { kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE' },
  data: u8a.fromString('input', 'base64'),
  signature: 'jSgVmRcmWwxHtAohgYHUNk9uKdaRj4gi04pjdxgwRaQyXJJJ6bMH50VyWMFvN9a6ZKjpdOahE2nJ+BWjr85nhQ==',
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
