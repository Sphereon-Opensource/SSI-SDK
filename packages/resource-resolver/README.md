<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>Resource Resolver (Typescript) 
  <br>
</h1>

---

**Warning: This package still is in very early development. Breaking changes without notice will happen at this point!**

---

A Veramo resource resolver plugin. This plugin has the option to cache resources and fetch them from a storage.

## Available functions

- resourceResolve
- resourceClearAllResources
- resourceDefaultStoreId
- resourceDefaultNamespace
- resourceDefaultTtl
-

## Usage

```typescript
import { IResourceResolver, ResourceResolver } from '@sphereon/ssi-sdk.resource-resolver'
import { KeyValueStoreEntity, kvStoreMigrations, KeyValueStore, KeyValueTypeORMStoreAdapter } from '@sphereon/ssi-sdk.kv-store-temp'

const dbConnection = createConnection({
  type: 'react-native',
  database: 'app.sqlite',
  location: 'default',
  logging: false,
  synchronize: false,
  migrationsRun: true,
  migrations: kvStoreMigrations,
  entities: [KeyValueStoreEntity],
})

const agent = createAgent<IResourceResolver>({
  plugins: [
    new ResourceResolver({
      resourceStores: new KeyValueStore({
        store: new KeyValueTypeORMStoreAdapter({ dbConnection }),
      }),
    }),
  ],
})
```

### Resolve a resource:

```typescript
const response = await agent.resourceResolve({
  input: 'https://example.com/example_resource.jpg',
  resourceType: 'example_type',
})
```

### Clear all resources:

```typescript
const storeId = '3c0e6c59-fe47-433c-a3d2-ad18b9c83517'
const result = await agent.resourceClearAllResources({ storeId })
```

### Get default store id:

```typescript
const result = await agent.resourceDefaultStoreId()
```

### Get default namespace:

```typescript
const result = await agent.resourceDefaultNamespace()
```

### Get default ttl:

```typescript
const result = await agent.resourceDefaultTtl()
```

## Installation

```shell
yarn add @sphereon/ssi-sdk.resource-resolver
```

## Build

```shell
yarn build
```
