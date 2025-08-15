<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>Sphereon's Musap Key Management System for react-native
  <br>
</h1>

## Overview

This module provides a Key Management System (KMS) wrapper that enables the use of MUSAP KMS functionalities within React Native projects. It extends the capabilities of the AbstractKeyManagementSystem by integrating the MUSAP library to align with Veramo's key management functions. This ensures that key generation, management, and signing operations are handled securely and efficiently.

## Available functions

- listKeys
- createKey
- deleteKey
- sign

### Installation

To install the module, use the following command:

```bash
yarn add @sphereon/ssi-sdk-ext.kms-musap-rn
```

## Usage

### Creating a Key

To create a key, you need to specify the key type and provide a keyAlias as part of the metadata. Here is an example of how to create a key:

```typescript
import { MusapKey } from '@sphereon/musap-react-native'
import { MusapKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-musap-rn'

const kms: MusapKeyManagementSystem = new MusapKeyManagementSystem('TEE')

async function createKeyExample() {
  try {
    const keyManagedInfo = await kms.createKey({ type: 'ECCP256R1' })
    console.log('Key created:', keyManagedInfo)
  } catch (error) {
    console.error('Error creating key:', error)
  }
}
```

### Signing Data

After creating a key, you can use it to sign data. Here's an example of how to sign data using a key created in the previous step:

```typescript
import { ManagedKeyInfo } from '@veramo/core'
import { MusapKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-musap-rn'

const kms: MusapKeyManagementSystem = new MusapKeyManagementSystem()

async function signDataExample(keyManagedInfo: ManagedKeyInfo, data: Uint8Array) {
  try {
    const signature = await kms.sign({ data, keyRef: { kid: keyManagedInfo.kid }, algorithm: 'SHA256withECDSA' })
    console.log('Signature:', signature)
  } catch (error) {
    console.error('Error signing data:', error)
  }
}
```

### Listing Keys

You can list all the keys managed by the KMS:

```typescript
async function listKeysExample() {
  try {
    const keys = await kms.listKeys()
    console.log('Managed keys:', keys)
  } catch (error) {
    console.error('Error listing keys:', error)
  }
}
```

### Deleting a Key

If you need to delete a key, use the deleteKey method:

```typescript
async function deleteKeyExample(kid: string) {
  try {
    const success = await kms.deleteKey({ kid })
    if (success) {
      console.log('Key deleted successfully')
    } else {
      console.warn('Failed to delete key')
    }
  } catch (error) {
    console.error('Error deleting key:', error)
  }
}
```
