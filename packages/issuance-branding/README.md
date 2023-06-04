<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>Issuance Branding (Typescript) 
  <br>
</h1>

---

**Warning: This package still is in very early development. Breaking changes without notice will happen at this point!**

---

A Veramo issuance branding plugin. This plugin manages issuer and credential branding and persists them. The branding can be used to display an issuer or credential.

NOTE
Credential manifest (link)
OpenID 4 VCI (link)

## Available functions

- ibAddCredentialBranding
- ibGetCredentialBranding
- ibUpdateCredentialBranding
- ibRemoveCredentialBranding
- ibAddCredentialLocaleBranding
- ibGetCredentialLocaleBranding
- ibRemoveCredentialLocaleBranding
- ibUpdateCredentialLocaleBranding
- ibAddIssuerBranding
- ibGetIssuerBranding
- ibUpdateIssuerBranding
- ibRemoveIssuerBranding
- ibAddIssuerLocaleBranding
- ibGetIssuerLocaleBranding
- ibRemoveIssuerLocaleBranding
- ibUpdateIssuerLocaleBranding

## Usage

### Adding the plugin to an agent:

```typescript
import { migrations, Entities } from '@veramo/data-store'
import { IssuanceBranding } from '@sphereon/ssi-sdk.issuance-branding'
import { IssuanceBrandingStore, DataStoreMigrations, DataStoreIssuanceBrandingEntities } from '@sphereon/ssi-sdk.data-store'

const dbConnection = createConnection({
  type: 'react-native',
  database: 'app.sqlite',
  location: 'default',
  logging: false,
  synchronize: false,
  migrationsRun: true,
  migrations: [...DataStoreMigrations, ...migrations],
  entities: [...DataStoreIssuanceBrandingEntities, ...Entities],
})

const agent = createAgent<IIssuanceBranding>({
  plugins: [
    new IssuanceBranding({
      store: new IssuanceBrandingStore(dbConnection),
    }),
  ],
})
```

### Add a credential branding:

```typescript
const contactId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const result = await agent.cmGetContact({
  contactId,
})
```

### Get credential branding:

```typescript
const contactId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const result = await agent.cmGetContact({
  contactId,
})
```

### Update a credential branding:

```typescript
const contactId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const result = await agent.cmGetContact({
  contactId,
})
```

### Remove a credential branding:

```typescript
const contactId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const result = await agent.cmGetContact({
  contactId,
})
```

### Add a credential locale branding:

```typescript
const contactId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const result = await agent.cmGetContact({
  contactId,
})
```

### Get credential locale branding:

```typescript
const contactId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const result = await agent.cmGetContact({
  contactId,
})
```

### Remove a credential locale branding:

```typescript
const contactId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const result = await agent.cmGetContact({
  contactId,
})
```

### Update a credential locale branding:

```typescript
const contactId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const result = await agent.cmGetContact({
  contactId,
})
```

### Add an issuer branding:

```typescript
const contactId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const result = await agent.cmGetContact({
  contactId,
})
```

### Get issuer branding:

```typescript
const contactId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const result = await agent.cmGetContact({
  contactId,
})
```

### Update an issuer branding:

```typescript
const contactId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const result = await agent.cmGetContact({
  contactId,
})
```

### Remove an issuer branding:

```typescript
const contactId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const result = await agent.cmGetContact({
  contactId,
})
```

### Add an issuer locale branding:

```typescript
const contactId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const result = await agent.cmGetContact({
  contactId,
})
```

### Get issuer locale branding:

```typescript
const contactId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const result = await agent.cmGetContact({
  contactId,
})
```

### Remove an issuer locale branding:

```typescript
const contactId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const result = await agent.cmGetContact({
  contactId,
})
```

### Update an issuer locale branding:

```typescript
const contactId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const result = await agent.cmGetContact({
  contactId,
})
```

## Installation

```shell
yarn add @sphereon/ssi-sdk.issuance-branding
```

## Build

```shell
yarn build
```
