<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>XState Machine Persistence
  <br>Allows to continue xstate machine at a later point in time

  <br>
</h1>

The XState Persistence Plugin is designed to manage and persist XState machine states, allowing for durable, long-term
storage of state machines.
This enables applications to save, load, and delete state machine instances, facilitating seamless state management and
recovery across sessions.

Features:

- Load State: Retrieve the current state of an XState machine from persistent storage.
- Delete Expired States: Automatically remove state instances that have exceeded their lifespan, or are finished
  ensuring efficient use of storage.
- Persist Machine Snapshot: Save snapshots of XState machine states, allowing for recovery and resumption of stateful
  processes. This can be done manually or it can be automatically registered with any xstate interpreter instance

Installation

To add the XState Persistence Plugin to your project, run:

```shell
yarn add @sphereon/ssi-sdk.xstate-machine-persistence
```

Or if you prefer using npm:

```shell
npm install @sphereon/ssi-sdk.xstate-machine-persistence
```

# Usage

Configuring the Plugin with Veramo

First, ensure you have Veramo set up in your project. Then, integrate the XState Persistence Plugin as follows:

```typescript
import { createAgent } from '@veramo/core'
import { MachineStatePersistence, DataStoreMachineStateMigrations, DataStoreMachineStateEntities } from '@sphereon/ssi-sdk.xstate-machine-persistence'

const dbConnection = await new DataSource({
  type: 'sqlite',
  database: ':memory:',
  logging: 'all',
  migrationsRun: false,
  migrations: DataStoreMachineStateMigrations, // Database migrations for the data store, specific for state machines
  synchronize: false,
  entities: DataStoreMachineStateEntities, // All the entities needed for the data store, related to state machines
}).initialize()

const agent = createAgent({
  plugins: [
    new MachineStatePersistence({
      eventTypes: ['EVERY'], // Enables listening to 'EVERY' events to persist the state on every state change
      store: new MachineStateStore(dbConnection),
    }),
  ],
})
```

## Automatic registration of state change persistence

You can use a simple method on an Xstate machine interpreter to automatically persist the latest state on every state
change of the machine, allowing for later continuation of the machine.

```typescript
import { createMachine, interpret } from 'xstate'
import { machineStatePersistRegistration } from '@sphereon/ssi-sdk.xstate-machine-persistence'

const context = { ...agent.context, agent }
export const exampleMachine = createMachine({
  predictableActionArguments: true,
  id: 'example',
  context: {},
  initial: 'init',
  states: {
    init: {
      id: 'init',
      on: {
        finalize: {
          target: 'final',
        },
      },
    },
    final: {
      id: 'final',
      type: 'final',
    },
  },
})

const instance = interpret(exampleMachine).start()

/**
 *  - instance is the Xstate Machine interpreter instance
 *  - context is the agent context
 *  - machineName is optional. It will be deduced from the machine if not provided. If you use a different name, be sure to use that for any future methods as well
 *  - instanceId is optional. Allows you to provide your own unique Id. If not provided a random uuid will be generated
 */
const registration = await machineStatePersistRegistration({ instance, context, machineName: exampleMachine.id })
console.log(JSON.stringify(registration))
/**
 * {
 *   "machineName": "example",
 *   "instanceId": "585b72e3-0655-4aee-a575-1234873ea7b0",
 *   "createdAt": "2024-03-07T22:47:45.445Z"
 * }
 */

// That is all. From this point on the machine will persist the state on every state change. You can use the instanceId value if you want to do anything with the persisted object at a later point in time
```

## Retrieving machine state info.

You can retrieve machine state info in 2 ways. If you know the instanceId, you can directly get it. Otherwise you can query for the active, read not finalized or cleaned up, instances of machine states.

Getting a single machine state info object by instance id:

```typescript
const machineStateInfo = await agent.machineStateGet({ instanceId })
console.log(JSON.stringify(machineStateInfo, null, 2))
/**
 * {
 *      "instanceId": "585b72e3-0655-4aee-a575-1234873ea7b0",
 *      "sessionId": "x:1",             <=== The xtsate session id. Please note that this is only unique for a single xstate instance in memory and will be lost accross restarts
 *      "machineName": "example",
 *      "latestStateName": "init",      <=== The latest state of the xstate machine for easy access
 *      "latestEventType": "increment", <=== The latest event of the xstate machine for easy access
 *      "state": {                      <=== This is the actual Xstate state
 *          "actions": [],
 *          "activities": {},
 *          "meta": {},
 *          ....
 *      },
 *      "createdAt": "2024-03-07T23:00:11.438Z",
 *      "updatedAt": "2024-03-07T23:00:11.543Z",
 *      "updatedCount": 1,              <=== The amount of updates applied to the persisted state (the amount of events/statechanges)
 *      "expiresAt": null,              <=== If this date-time is set, the machine state will not be used anymore
 *      "completedAt": null             <=== The date-time the instance reached a final state
 * }
 */
```

Getting active machine state info objects by machine name:

```typescript
const machineStateInfos = await agent.machineStatesFindActive({ machineName: 'example' })
console.log(JSON.stringify(machineStateInfos[0], null, 2))
// See console.log example in previous code block
```

## Manual persistence and cleanup methods

Persisting a Machine Snapshot

To save the current state of an XState machine:

```typescript
await agent.machineStatePersist({
  instanceId: 'your-state-instanceId',
  state: 'You Xstate here',
})
```

Deleting Expired States

To clean up expired states from the storage:

```typescript
await agent.machineStatesDeleteExpired({
  deleteDoneStates: false, // Optional: If true, will delete any states that are completed. If false, will delete any expired states, no matter whether they are done or not
  machineName: 'example', // Optional: Only delete istances for machines named 'example'
})
```
