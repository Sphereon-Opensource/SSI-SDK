<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>Connection Manager (Typescript) 
  <br>
</h1>

---

**Warning: This package still is in very early development. Breaking changes without notice will happen at this point!**

---

A Veramo connection manager plugin. This plugin manages connection configurations to third parties and persists them. These configurations can then be used to establish the connection.

## Supported connection types

For now the following connection types are supported:

- OpenID
- DID AUTH SIOP

## Available functions

- cmGetParty
- cmGetParties
- cmAddParty
- cmUpdateParty
- cmRemoveParty
- cmGetConnection
- cmGetConnections
- cmAddConnection
- cmUpdateConnection
- cmRemoveConnection

## Usage

### Adding the plugin to an agent:

```typescript
import { migrations, Entities } from '@veramo/data-store'
import DataStoreConnectionEntities from '@sphereon/ssi-sdk-connection-manager'
import { DataStoreMigrations } from '@sphereon/ssi-sdk-data-store'

const dbConnection = createConnection({
  type: 'react-native',
  database: 'app.sqlite',
  location: 'default',
  logging: false,
  synchronize: false,
  migrationsRun: true,
  migrations: [...DataStoreMigrations, ...migrations],
  entities: [...DataStoreConnectionEntities, ...Entities],
})

const agent = createAgent<IConnectionManager>({
  plugins: [
    new ConnectionManager({
      store: new TestConnectionStore(dbConnection),
    }),
  ],
})
```

### Get a party:

```typescript
const partyId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const result = await agent.cmGetConnection({
  partyId,
})
```

### Get parties:

```typescript
const result = await agent.cmGetParties()
```

### Add a party:

```typescript
const result = await agent.cmAddParty({ name: 'Party' })
```

### Update a party:

```typescript
const partyId = '8efb937f-4e90-4056-9a4d-7185ce8dc173'
const party = await agent
  .cmGetConnection({
    partyId,
  })
  .then((party) => {
    return { ...party, name: 'new_name' }
  })

const result = await agent.cmUpdateParty({ party })
```

### Remove a party:

```typescript
const partyId = 'ef6e13b2-a520-4bb6-9a13-9be529ce22b8'
const result = await agent.cmRemoveParty({ partyId })
```

### Get a connection:

```typescript
const connectionId = 'cdfd231c-6d40-4e43-9bd0-e8c97262ffe1'
const result = await agent.cmGetConnection({
  connectionId,
})
```

### Get connections:

```typescript
const partyId = '00492d95-22b9-41c1-b475-90bf1667ae52'
const result = await agent.cmGetConnections({ partyId })
```

### Add a connection:

```typescript
const partyId = 'a4a47842-43a7-4741-9562-0fb3a973ec98'
const connection: {
  type: ConnectionTypeEnum.OPENID
  identifier: {
    type: ConnectionIdentifierEnum.URL
    correlationId: 'https://example.com'
  }
  config: {
    clientId: '138d7bf8-c930-4c6e-b928-97d3a4928b01'
    clientSecret: '03b3955f-d020-4f2a-8a27-4e452d4e27a0'
    scopes: ['auth']
    issuer: 'https://example.com/app-test'
    redirectUrl: 'app:/callback'
    dangerouslyAllowInsecureHttpRequests: true
    clientAuthMethod: 'post'
  }
  metadata: [
    {
      label: 'Authorization URL'
      value: 'https://example.com'
    },
    {
      label: 'Scope'
      value: 'Authorization'
    }
  ]
}
const result = await agent.cmAddConnection({
  partyId,
  connection,
})
```

### Update a connection:

```typescript
const connectionId = 'cdfd231c-6d40-4e43-9bd0-e8c97262ffe1'
const result = await agent
  .cmGetConnection({
    connectionId,
  })
  .then((connection) => {
    return { ...connection, identifier: { ...connection.identifier, correlationId: 'new_id' } }
  })
const connection = await agent.cmUpdateConnection({ connection })
```

### Remove a connection:

```typescript
const connectionId = 'cdfd231c-6d40-4e43-9bd0-e8c97262ffe1'
await agent.cmRemoveConnection({
  connectionId,
})
```

## Installation

```shell
yarn add @sphereon/ssi-sdk-connection-manager
```

## Build

```shell
yarn build
```
