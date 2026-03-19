<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>Credential Design Manager (Typescript)
  <br>
</h1>

---

**Warning: This package still is in very early development. Breaking changes without notice will happen at this point!**

---

A Veramo credential design manager plugin. This plugin manages credential designs, including metadata keys, schema definitions, and branding configurations, and persists them. These designs can then be used to configure credential issuance and presentation.

## Available functions

- cdmGetCredentialDesign
- cdmGetCredentialDesigns
- cdmAddCredentialDesign
- cdmUpdateCredentialDesign
- cdmRemoveCredentialDesign

## Usage

### Adding the plugin to an agent:

```typescript
import { migrations, Entities } from '@veramo/data-store'
import { CredentialDesignManager } from '@sphereon/ssi-sdk.credential-design-manager'
import { CredentialDesignStore, DataStoreMigrations, DataStoreEntities } from '@sphereon/ssi-sdk.data-store'

const dbConnection = createConnection({
  type: 'react-native',
  database: 'app.sqlite',
  location: 'default',
  logging: false,
  synchronize: false,
  migrationsRun: true,
  migrations: [...DataStoreMigrations, ...migrations],
  entities: [...DataStoreEntities, ...Entities],
})

const agent = createAgent<ICredentialDesignManager>({
  plugins: [
    new CredentialDesignManager({
      store: new CredentialDesignStore(dbConnection),
    }),
  ],
})
```

### Get a credential design:

```typescript
const credentialDesignId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const result = await agent.cdmGetCredentialDesign({
  credentialDesignId,
})
```

### Get credential designs:

```typescript
const result = await agent.cdmGetCredentialDesigns()
```

### Get credential designs by tenant:

```typescript
const result = await agent.cdmGetCredentialDesigns({
  filter: { tenantId: 'your-tenant-id' },
})
```

### Add a credential design:

```typescript
const result = await agent.cdmAddCredentialDesign({
  name: 'MyCredentialDesign',
  tenantId: 'your-tenant-id',
  design: {
    label: 'MyCredentialDesign',
    metadataKeys: [
      {
        key: 'credentialType',
        valueType: ValueType.Text,
        metadataValues: [
          { index: 0, textValue: 'VerifiableCredential' },
          { index: 1, textValue: 'MyCredentialDesign' },
        ],
      },
    ],
    schemaDefinitions: [
      {
        correlationId: 'MyCredentialDesign',
        schemaType: 'Data',
        entityType: 'VC',
        schema: JSON.stringify({ type: 'object', properties: { name: { type: 'string' } } }),
      },
    ],
    branding: {
      textColor: '#FFFFFF',
      backgroundColor: '#003399',
      logo: {
        uri: 'https://example.com/logo.png',
        mediaType: 'image/png',
        alt: 'Logo',
        dimensions: { width: 200, height: 100 },
      },
    },
  },
})
```

### Update a credential design:

```typescript
const credentialDesignId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const result = await agent.cdmUpdateCredentialDesign({
  credentialDesignId,
  name: 'UpdatedDesignName',
  design: {
    metadataKeys: [
      {
        key: 'credentialFormat',
        valueType: ValueType.Text,
        metadataValues: [{ index: 0, textValue: 'sd-jwt' }],
      },
    ],
  },
})
```

### Remove a credential design:

```typescript
const credentialDesignId = 'ef6e13b2-a520-4bb6-9a13-9be529ce22b8'
const result = await agent.cdmRemoveCredentialDesign({ credentialDesignId })
```

## Installation

```shell
yarn add @sphereon/ssi-sdk.credential-design-manager
```

## Build

```shell
yarn build
```
