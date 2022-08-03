<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>Domain Linkage Verifier (Typescript) 
  <br>
</h1>

---

**Warning: This package still is in very early development. Breaking changes without notice will happen at this point!**

---

A Veramo connection manager plugin. This plugin manages connection configurations to third parties and persists them. These configurations can then be used to establish the connection.

## Supported connection types


## Available functions

## Usage

### Adding the plugin to an agent:

```typescript
const agent = createAgent<IConnectionManager>({
  plugins: [
    new ConnectionManager(),
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

## Installation

```shell
yarn add @sphereon/ssi-sdk-domain-linkage-verifier
```

## Build

```shell
yarn build
```
