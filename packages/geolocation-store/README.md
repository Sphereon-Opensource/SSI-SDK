<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>Geolocation Store (Typescript) 
  <br>
</h1>

---

**Warning: This package still is in very early development. Breaking changes without notice will happen at this point!**

---

A Sphereon geolocation store plugin. This plugin stores the result of the location lookup which is part of the anomaly detection plugin

## Available functions

- geolocationStorePersistLocation
- geolocationStoreHasLocation
- geolocationStoreRemoveLocation
- geolocationStoreClearAllLocations
- geolocationStoreGetLocation
- geolocationStoreDefaultLocationStore

## Usage

### Adding the plugin to an agent:

```typescript
import { GeoLocationStore } from '@sphereon/ssi-sdk.geolocation-store'

const agent = createAgent<IGeoLocationStore>({
  plugins: [new GeoLocationStore()],
})
```

### Persist a location:

```typescript
await agent.geolocationStorePersistLocation({
  ipOrHostname: '77.247.248.1',
  locationArgs: { continent: 'EU', country: 'AL' },
})
```

### Check if a location exists in the database

```typescript
await agent.geolocationStoreHasLocation({
  ipOrHostname: '77.247.248.1',
  storeId: '_default',
  namespace: 'anomaly-detection',
})
```

### Retrieve a location

```typescript
await agent.geolocationStoreGetLocation({
  ipOrHostname: '77.247.248.1',
  storeId: '_default',
  namespace: 'anomaly-detection',
})
```

### Remove a location

```typescript
await agent.geolocationStoreRemoveLocation({
  ipOrHostname: '77.247.248.1',
  storeId: '_default',
  namespace: 'anomaly-detection',
})
```

### Delete all locations

```typescript
await agent.geolocationStoreClearAllLocations()
```

### Retrieves the default location store

```typescript
await agent.geolocationStoreDefaultLocationStore()
```

## Installation

```shell
yarn add @sphereon/ssi-sdk.geolocation-store
```

## Build

```shell
yarn build
```
