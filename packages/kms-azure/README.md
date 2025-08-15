<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>Sphereon's Azure KeyVault Key Management System Plugin
  <br>
</h1>

## Overview

This module provides a Key Management System (KMS) wrapper that enables the use of Azure Key Vault KMS functionalities within your application. It extends the capabilities of the AbstractKeyManagementSystem by integrating with Azure's robust key management features. This ensures that key generation, management, and signing operations are handled securely and efficiently, aligning with Veramo's key management functions.

## Available functions

- createKey
- sign
- verify

### Installation

To install the module, use the following command:

```bash
yarn add @sphereon/ssi-sdk-ext.kms-azure
```

## Usage

### Creating a Key

To create a key, you eed to specify the key type and provide a keyAlias as part of the metadata. Here is an example of how to create a key:

```typescript
import { AzureKeyVaultCryptoProvider, com } from '@sphereon/kmp-crypto-kms-azure'
import AzureKeyVaultClientConfig = com.sphereon.crypto.kms.azure.AzureKeyVaultClientConfig

const id = 'azure-keyvault-test'
const keyVaultUrl = 'https://example.vault.azure.net/'
const tenantId = '70f978d7-0acc-4f0f-9c07-4284863dc678'
const credentialOptions = new com.sphereon.crypto.kms.azure.CredentialOpts(
  com.sphereon.crypto.kms.azure.CredentialMode.SERVICE_CLIENT_SECRET,
  new com.sphereon.crypto.kms.azure.SecretCredentialOpts('19bfd54e-e3e6-4fbe-9f41-b26af93017ca', '4xpCwvGr0xTd2wrarCM2CrQnt1ceFSsr.JgdYbgq')
)

const config = new AzureKeyVaultClientConfig(id, keyVaultUrl, tenantId, credentialOptions)

const client = new AzureKeyVaultCryptoProvider(config)

async function createKeyExample() {
  client
    .createKey({ type: 'Secp256r1' })
    .then((key) => {
      console.log('Key created:', key)
    })
    .catch((error) => {
      console.error('Error creating key:', error)
    })
}

createKeyExample()
```
