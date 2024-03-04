<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>XState Persistence (Typescript) 
  <br>
</h1>

---

**Warning: This package still is in very early development. Breaking changes without notice will happen at this point!**

---

A Veramo contact manager plugin. This plugin manages xstate and identity configurations to third parties and persists them. These configurations can then be used to establish a connection.

The XState Persistence Plugin for Veramo is designed to manage and persist XState machine states, allowing for durable, long-term storage of state machine snapshots. This enables applications to save, load, and delete state machine instances, facilitating seamless state management and recovery across sessions.
Features:

- Load State: Retrieve the current state of an XState machine from persistent storage.
- Delete Expired States: Automatically remove state instances that have exceeded their lifespan, ensuring efficient use of storage.
- Persist Machine Snapshot: Save snapshots of XState machine states, allowing for recovery and resumption of stateful processes.

Installation

To add the XState Persistence Plugin to your project, run:

```shell
yarn add @sphereon/xstate-persistence-plugin
```

Or if you prefer using npm:

```shell
npm install @sphereon/xstate-persistence-plugin
```

Usage
Configuring the Plugin with Veramo

First, ensure you have Veramo set up in your project. Then, integrate the XState Persistence Plugin as follows:

```typescript
import { createAgent } from '@veramo/core'
import { XStatePersistencePlugin } from '@sphereon/xstate-persistence-plugin'

const agent = createAgent({
  plugins: [
    new XStatePersistencePlugin({
      // Plugin options here
    }),
  ],
})
```

Persisting a Machine Snapshot

To save the current state of an XState machine:

```typescript
await agent.persistMachineSnapshot({
  stateId: 'your-state-id',
  type: 'YourMachineType',
  eventName: 'YOUR_EVENT_NAME',
  state: 'serialized-state-here', // Your XState machine state serialized as a string
  expiresAt: new Date('2023-01-01'), // Optional expiration date
})
```

Loading a State

To load the latest snapshot of a specific machine type:

```typescript
const state = await agent.loadState({
  type: 'YourMachineType',
})
```

Deleting Expired States

To clean up expired states from the storage:

````typescript
await agent.deleteExpiredStates({
type: 'YourMachineType', // Optional: Specify the machine type to narrow down the deletion
});```

Contributing

Contributions are welcome! Please open an issue or submit a pull request for any bugs, features, or improvements.
License

This project is licensed under the MIT License.
````
