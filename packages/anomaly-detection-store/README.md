<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>Anomaly Detection Store (Typescript) 
  <br>
</h1>

---

**Warning: This package still is in very early development. Breaking changes without notice will happen at this point!**

---

A Veramo anomaly detection store plugin. This plugin stores the result of the location lookup which is part of the anomaly detection plugin

## Available functions

- lookupLocation

## Usage

### Adding the plugin to an agent:

```typescript
import { AnomalyDetectionStore } from '@sphereon/ssi-sdk.anomaly-detection'

const agent = createAgent<IAnomalyDetectionStore>({
  plugins: [
    new AnomalyDetectionStore({
      geoIpDBPath: './GeoLite2-Country.mmdb',
    }),
  ],
})
```

### Lookup a location:

```typescript
const result = await agent.lookupLocation({
    ipOrHostname: '2001:0000:130F:0000:0000:09C0:876A:130B'
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
