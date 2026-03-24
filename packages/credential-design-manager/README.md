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

The manager accepts high-level arguments (schema, uiSchema, credential format options, branding) and translates them into the underlying data store format (metadata keys, schema definitions, branding entities).

## Available functions

- cdmGetCredentialDesign
- cdmGetCredentialDesigns (with pagination: limit, offset)
- cdmAddCredentialDesign
- cdmUpdateCredentialDesign
- cdmRemoveCredentialDesign
- cdmCredentialDesignCount
- cdmFormStepGetOrCreate

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

### Add a credential design:

```typescript
const result = await agent.cdmAddCredentialDesign({
  identifier: 'MyCredentialDesign',
  tenantId: 'your-tenant-id',
  schema: { type: 'object', properties: { name: { type: 'string' } } },
  uiSchema: { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/name' }] },
  options: {
    format: 'sd-jwt',
    vct: 'MyVCT',
    scope: 'my_scope',
    cryptographicBindingMethodsSupported: ['did:key', 'did:jwk'],
    credentialSigningAlgValuesSupported: ['ES256'],
    proofTypesSupported: { jwt: { proof_signing_alg_values_supported: ['ES256'] } },
  },
  isAdvancedSchema: false,
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
})
```

### Get a credential design:

```typescript
const credentialDesignId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const result = await agent.cdmGetCredentialDesign({
  credentialDesignId,
})
```

### List credential designs with pagination:

```typescript
const result = await agent.cdmGetCredentialDesigns({
  filter: { tenantId: 'your-tenant-id' },
  limit: 10,
  offset: 0,
})
```

### Count credential designs:

```typescript
const result = await agent.cdmCredentialDesignCount({
  filter: { tenantId: 'your-tenant-id' },
})
console.log(result.count)
```

### Update a credential design:

```typescript
const credentialDesignId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const result = await agent.cdmUpdateCredentialDesign({
  credentialDesignId,
  identifier: 'UpdatedDesignName',
  schema: { type: 'object', properties: { age: { type: 'number' } } },
  uiSchema: { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/age' }] },
  options: {
    format: 'sd-jwt',
  },
})
```

### Remove a credential design:

```typescript
const credentialDesignId = 'ef6e13b2-a520-4bb6-9a13-9be529ce22b8'
const result = await agent.cdmRemoveCredentialDesign({ credentialDesignId })
console.log(result.result) // true
```

### Get or create a form step:

```typescript
const result = await agent.cdmFormStepGetOrCreate({ formId: 'credentialIssuanceWizard' })
console.log(result.formStepId)
```

## Installation

```shell
yarn add @sphereon/ssi-sdk.credential-design-manager
```

## Build

```shell
yarn build
```
