<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>Sphereon's Azure KeyVault Key Management System REST Client Plugin
  <br>
</h1>

## Overview

This module provides a Key Management System (KMS) wrapper that enables the use of Azure Key Vault REST client functionalities within your application. It extends the capabilities of the `AbstractKeyManagementSystem` by integrating with Azure's robust key management features. This ensures that key generation, signing, and verification operations are handled securely and efficiently, aligning with Veramo's key management functions.

## Available Functions

- `createKey`
- `sign`
- `verify`

## Installation

To install the module, use the following command:

```bash
yarn add @sphereon/ssi-sdk-ext.kms-azure-rest-client
```

## Usage

### Creating a Key

To create a key, you need to specify the key type and optionally provide metadata, such as a key alias. Below is an example of how to create a key using the `AzureKeyVaultKeyManagementSystemRestClient`:

```typescript
import { AzureKeyVaultKeyManagementSystemRestClient } from '@sphereon/kms-azure-rest-client'

const options = {
  applicationId: 'azure-keyvault-test',
  vaultUrl: 'https://example.vault.azure.net/',
  apiKey: 'your-api-key-here',
}

const keyManagementSystem = new AzureKeyVaultKeyManagementSystemRestClient(options)

async function createKeyExample() {
  try {
    const key = await keyManagementSystem.createKey({
      type: 'Secp256r1',
      meta: { keyAlias: 'my-secure-key' },
    })

    console.log('Key created:', key)
  } catch (error) {
    console.error('Error creating key:', error)
  }
}

createKeyExample()
```

### Signing Data

To sign data, provide the key reference (`kid`) and the data to be signed:

```typescript
async function signExample() {
  try {
    const signature = await keyManagementSystem.sign({
      keyRef: { kid: 'your-key-id' },
      data: new TextEncoder().encode('data-to-sign'),
    })

    console.log('Signature:', signature)
  } catch (error) {
    console.error('Error signing data:', error)
  }
}

signExample()
```

### Verifying Data

To verify data, provide the key reference (`kid`), the data, and the signature:

```typescript
async function verifyExample() {
  try {
    const isValid = await keyManagementSystem.verify({
      keyRef: { kid: 'your-key-id' },
      data: new TextEncoder().encode('data-to-verify'),
      signature: 'signature-to-verify',
    })

    console.log('Is signature valid?', isValid)
  } catch (error) {
    console.error('Error verifying signature:', error)
  }
}

verifyExample()
```

## Configuration

The `AzureKeyVaultKeyManagementSystemRestClient` requires the following configuration options:

- `applicationId`: A unique identifier for your application.
- `vaultUrl`: The base URL of your Azure Key Vault.
- `apiKey`: The API key for authenticating requests.

## Limitations

This implementation currently supports the following key operations:

- `createKey`
- `sign`
- `verify`

Additional functionalities like `sharedSecret`, `importKey`, `deleteKey`, and `listKeys` are not implemented in this version and will throw an error if called.

## License

This project is licensed under the [MIT License](LICENSE).
