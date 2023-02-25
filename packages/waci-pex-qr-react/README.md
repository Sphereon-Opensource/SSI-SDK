<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>waci-pex-qr-react (Typescript) 
  <br>
</h1>

---

**Warning: This package still is in very early development. Breaking changes without notice will happen at this point!**

---

# waci-pex-qr-react

A `Sphereon SSI-SDK` plugin to create an QR code and to verify using `SIOPv2` or `OIDC4`. This plugin component is only
supporting react and react-native frameworks.

It will be possible in future to request the issuer to issue credentials.

### Installation

```shell
yarn add @sphereon/ssi-sdk-waci-pex-qr-react
```

### Build

```shell
yarn build
```

### Usage

The usage scenario will include the plugin code to be integrated in the client code. A party will be requesting the
recipient to either:

1. authenticate itself to the requester
2. inviting the issuer to issue a credential

The object fields required to generate the QR code will depend on the type of request and the acceptable values. The
possible `accept` value may be:

1. `oidc4vp`
2. `siopv2+oidc4vp`
3. `siopv2`
4. `didcomm/v2`

#### Importing the plugin

```typescript
import { QrCodeProvider } from '@sphereon/ssi-sdk-waci-pex-qr-react'

// Include in the interface
// const agent = createAgent<...  QrCodeProvider>
```

#### Adding plugin to the agent

```typescript
plugins: [
  ...
    new QrCodeProvider()
],
```

#### Export for the function

```typescript
export const createSsiQrCode = agent.ssiQrCode
```

The function declared in agent can be imported for usage like below:

```typescript
import { createSsiQrCode } from '../agent'
import { QRContent, QRType } from '@sphereon/ssi-sdk-waci-pex-qr-react'
```

#### Inside the component we can declare or get the values to pass to QR Code plugin

```typescript
import { WaciOobProps } from '@sphereon/ssi-sdk-waci-pex-qr-react'

function getOobQrCodeProps(): QRRenderingProps {
  return {
    baseUrl: 'https://example.com/?oob=',
    type: QRType.SIOPV2,
    id: '599f3638-b563-4937-9487-dfe55099d900',
    from: 'did:key:zrfdjkgfjgfdjk',
    object: {
      goalCode: GoalCode.STREAMLINED_VP,
      accept: [AcceptMode.SIOPV2_WITH_OIDC4VP],
    },
    onGenerate: (oobQRProps: QRRenderingProps, payload: WaciOobProps) => {
      console.log(payload)
    },
    bgColor: 'white',
    fgColor: 'black',
    level: 'L',
    size: 128,
    title: 'title2021120903',
  }
}

delegateCreateOobQRCode = () => {
  let qrCode = createQrCode(this.getOobQrCodeProps())
  return qrCode.then((qrCodeResolved) => {
    return qrCodeResolved
  })
}
```

On generate gives the following (example) output

```json lines
{
  "type": "openid",
  "id": "599f3638-b563-4937-9487-dfe55099d900",
  "from": "did:key:zrfdjkgfjgfdjk",
  "object": {
    "goal-code": "streamlined-vp",
    "accept": ["siopv2+oidc4vp"]
  }
}
```

If you want to create the payload manually and want to do serialization yourself you can use:

```typescript
const payload = DidCommOutOfBandMessage.createPayload(getOobQrCodeProps())
const encoded = DidCommOutOfBandMessage.urlEncode(payload)
const url = oobQRProps.baseUrl + encoded
console.log(url) // https://example.com/?oob=eyJ0eXBlIjoic2lvcHYyIiwiaWQiOiI1OTlmMzYzOC1iNTYzLTQ5MzctOTQ4Ny1kZmU1NTA5OWQ5MDAiLCJmcm9tIjoiZGlkOmtleTp6cmZkamtnZmpnZmRqayIsImJvZHkiOnsiZ29hbC1jb2RlIjoic3RyZWFtbGluZWQtdnAiLCJhY2NlcHQiOlsic2lvcHYyK29pZGM0dnAiXX19
```

#### For rendering add to the view

```jsx
<View>
  //...
  {this.delegateCreateOobQRCode()}
</View>
```
