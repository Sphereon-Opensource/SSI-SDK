<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>Contact Manager (Typescript) 
  <br>
</h1>

---

**Warning: This package still is in very early development. Breaking changes without notice will happen at this point!**

---

A Veramo contact manager plugin. This plugin manages contacts and identity configurations to third parties and persists them. These configurations can then be used to establish a connection.

## Supported identity connection types

For now the following connection types are supported:

- OpenID Connect
- Self Issued OpenID v2

## Available functions

- cmGetContact
- cmGetContacts
- cmAddContact
- cmUpdateContact
- cmRemoveContact
- cmGetIdentity
- cmGetIdentities
- cmAddIdentity
- cmUpdateIdentity
- cmRemoveIdentity

## Usage

### Adding the plugin to an agent:

```typescript
import { migrations, Entities } from '@veramo/data-store'
import { ContactManager } from '@sphereon/ssi-sdk.contact-manager'
import { ContactStore, DataStoreMigrations, DataStoreContactEntities } from '@sphereon/ssi-sdk.data-store'

const dbConnection = createConnection({
  type: 'react-native',
  database: 'app.sqlite',
  location: 'default',
  logging: false,
  synchronize: false,
  migrationsRun: true,
  migrations: [...DataStoreMigrations, ...migrations],
  entities: [...DataStoreContactEntities, ...Entities],
})

const agent = createAgent<IContactManager>({
  plugins: [
    new ContactManager({
      store: new ContactStore(dbConnection),
    }),
  ],
})
```

### Get a contact:

```typescript
const contactId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const result = await agent.cmGetContact({
  contactId,
})
```

### Get contacts:

```typescript
const result = await agent.cmGetContacts()
```

### Add a contact:

```typescript
const result = await agent.cmAddContact({ name: 'contact_name', alias: 'contact_alias' })
```

### Update a contact:

```typescript
const contactId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const contact = await agent
  .cmGetContact({
    contact,
  })
  .then((contact) => {
    return { ...contact, name: 'new_name' }
  })

const result = await agent.cmUpdateContact({ contact })
```

### Remove a contact:

```typescript
const contactId = 'ef6e13b2-a520-4bb6-9a13-9be529ce22b8'
const result = await agent.cmRemoveContact({ contactId })
```

### Get an identity:

```typescript
const identityId = 'cdfd231c-6d40-4e43-9bd0-e8c97262ffe1'
const result = await agent.cmGetIdentity({
  identityId,
})
```

### Get identities:

```typescript
const contactId = '00492d95-22b9-41c1-b475-90bf1667ae52'
const result = await agent.cmGetIdentities({ contactId })
```

### Add an identity:

```typescript
const contactId = 'a4a47842-43a7-4741-9562-0fb3a973ec98'
const identity = {
  alias: correlationId,
  identifier: {
    type: CorrelationIdentifierType.URL,
    correlationId,
  },
  connection: {
    type: ConnectionType.DIDAUTH,
    config: {
      identifier: {
        did: 'did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01',
        provider: 'test_provider',
        keys: [],
        services: [],
      },
      redirectUrl: 'https://example.com',
      stateId: 'e91f3510-5ce9-42ee-83b7-fa68ff323d27',
      sessionId: 'https://example.com/did:test:138d7bf8-c930-4c6e-b928-97d3a4928b01',
    },
  },
  metadata: [
    {
      label: 'Authorization URL',
      value: 'https://example.com',
    },
    {
      label: 'Scope',
      value: 'Authorization',
    },
  ],
}

const result = await agent.cmAddIdentity({
  contactId,
  identity,
})
```

### Update an identity:

```typescript
const identityId = 'cdfd231c-6d40-4e43-9bd0-e8c97262ffe1'
const identity = await agent
  .cmGetIdentity({
    identityId,
  })
  .then((identity) => {
    return { ...identity, alias: 'new_alias' }
  })
const result = await agent.cmUpdateIdentity({ identity })
```

### Remove an identity:

```typescript
const identityId = 'cdfd231c-6d40-4e43-9bd0-e8c97262ffe1'
await agent.cmRemoveIdentity({
  identityId,
})
```

## Installation

```shell
yarn add @sphereon/ssi-sdk.contact-manager
```

## Build

```shell
yarn build
```
