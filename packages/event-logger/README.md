<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>Event Logger (Typescript) 
  <br>
</h1>

---

**Warning: This package still is in very early development. Breaking changes without notice will happen at this point!**

---

A Veramo event logger plugin. This plugin allows for listening to events and to persist them into a database.
There are also functions that can be manually called to persist events. Current, only audit events are supported that can be used to create an audit log.

Ideally this plugin should be used in combination with the event logger from our core package. This event logger will also default debug the events.
This is mainly as a fallback for when no listener is present within the agent.

## Available functions

- loggerGetAuditEvents
- loggerStoreAuditEvent

## Usage

### Adding the plugin to an agent:

```typescript
import { migrations, Entities } from '@veramo/data-store'
import { EventLogger, IEventLogger } from '@sphereon/ssi-sdk.event-logger'
import { EventLoggerStore, DataStoreMigrations, DataStoreEventLoggerEntities } from '@sphereon/ssi-sdk.data-store'
import { LoggingEventType } from '@sphereon/ssi-sdk.core'

const dbConnection = createConnection({
  type: 'react-native',
  database: 'app.sqlite',
  location: 'default',
  logging: false,
  synchronize: false,
  migrationsRun: true,
  migrations: [...DataStoreMigrations, ...migrations],
  entities: [...DataStoreEventLoggerEntities, ...Entities],
})

const agent = createAgent<IEventLogger>({
  plugins: [
    new EventLogger({
      eventTypes: [LoggingEventType.AUDIT],
      store: new EventLoggerStore(dbConnection),
    }),
  ],
})
```

### Log event using event listener:

```typescript
import {
  EventLogger,
  EventLoggerBuilder,
  LoggingEventType,
  LogLevel,
  System,
  SubSystem,
  ActionType,
  InitiatorType,
  SystemCorrelationIdType,
  PartyCorrelationType,
} from '@sphereon/ssi-sdk.core'

const agentContext = { agent }
const logger: EventLogger = new EventLoggerBuilder().withContext(agentContext).withNamespace('custom_namespace').build()

await logger.logEvent({
  type: LoggingEventType.AUDIT,
  data: {
    level: LogLevel.DEBUG,
    correlationId: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
    system: System.GENERAL,
    subSystemType: SubSystem.DID_PROVIDER,
    actionType: ActionType.CREATE,
    actionSubType: 'Key generation',
    initiatorType: InitiatorType.EXTERNAL,
    systemCorrelationIdType: SystemCorrelationIdType.DID,
    systemCorrelationId: 'did:example:123456789abcdefghi',
    systemAlias: 'test_alias',
    partyCorrelationType: PartyCorrelationType.DID,
    partyCorrelationId: 'did:example:123456789abcdefghi',
    partyAlias: 'test_alias',
    description: 'test_description',
    data: 'test_data_string',
    diagnosticData: { data: 'test_data_string' },
  },
})
```

### Log event manually:

```typescript
import {
  AuditLoggingEvent,
  LogLevel,
  System,
  SubSystem,
  ActionType,
  InitiatorType,
  SystemCorrelationIdType,
  PartyCorrelationType,
} from '@sphereon/ssi-sdk.core'
import { GetAuditEventsArgs, NonPersistedAuditLoggingEvent } from '@sphereon/ssi-sdk.event-logger'

const auditEvent: NonPersistedAuditLoggingEvent = {
  level: LogLevel.DEBUG,
  correlationId: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
  system: System.GENERAL,
  subSystemType: SubSystem.DID_PROVIDER,
  actionType: ActionType.CREATE,
  actionSubType: 'Key generation',
  initiatorType: InitiatorType.EXTERNAL,
  systemCorrelationIdType: SystemCorrelationIdType.DID,
  systemCorrelationId: 'did:example:123456789abcdefghi',
  systemAlias: 'test_alias',
  partyCorrelationType: PartyCorrelationType.DID,
  partyCorrelationId: 'did:example:123456789abcdefghi',
  partyAlias: 'test_alias',
  description: 'test_description',
  data: 'test_data_string',
  diagnosticData: { data: 'test_data_string' },
}

const result: AuditLoggingEvent = await agent.loggerLogAuditEvent({ event: auditEvent })
```

### Retrieve audit events:

```typescript
import {
  AuditLoggingEvent,
  LogLevel,
  System,
  SubSystem,
  ActionType,
  InitiatorType,
  SystemCorrelationIdType,
  PartyCorrelationType,
} from '@sphereon/ssi-sdk.core'
import { GetAuditEventsArgs, NonPersistedAuditLoggingEvent } from '@sphereon/ssi-sdk.event-logger'

const auditEvent: NonPersistedAuditLoggingEvent = {
  level: LogLevel.DEBUG,
  correlationId: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
  system: System.GENERAL,
  subSystemType: SubSystem.DID_PROVIDER,
  actionType: ActionType.CREATE,
  actionSubType: 'Key generation',
  initiatorType: InitiatorType.EXTERNAL,
  systemCorrelationIdType: SystemCorrelationIdType.DID,
  systemCorrelationId: 'did:example:123456789abcdefghi',
  systemAlias: 'test_alias',
  partyCorrelationType: PartyCorrelationType.DID,
  partyCorrelationId: 'did:example:123456789abcdefghi',
  partyAlias: 'test_alias',
  description: 'test_description',
  data: 'test_data_string',
  diagnosticData: { data: 'test_data_string' },
}

await agent.loggerLogAuditEvent({ event: auditEvent })
const getAuditEventArgs: GetAuditEventsArgs = {
  filter: [{ correlationId: auditEvent.correlationId }],
}
const result: Array<AuditLoggingEvent> = await agent.loggerGetAuditEvents(getAuditEventArgs)
```

## Installation

```shell
yarn add @sphereon/ssi-sdk.event-logger
```

## Build

```shell
yarn build
```
