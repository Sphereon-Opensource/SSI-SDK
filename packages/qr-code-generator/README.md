<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>qr-code-generator (Typescript) 
  <br>
</h1>

# qr-code-generator

A `Sphereon SSI-SDK` plugin to create an QR codes for `SIOPv2/OpenID4VP`, `DIDCommv2` and `OpenID4VCI`.
Next to the above specific QR types, of course you can also generate generic QR codes with this package.

It is tailored towards React and React-Native but also provides textual representations.

### Installation

```shell
yarn add @sphereon/ssi-sdk.qr-code-generator
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

#### Importing the plugin

```typescript
import { QrCodeProvider } from '@sphereon/ssi-sdk.qr-code-generator'

// Include in the interface
// const agent = createAgent<...  QrCodeProvider>
```

#### Adding plugin to the agent

```typescript
plugins: [...new QrCodeProvider()]
```

#### Inside the component we can declare or get the values to pass to QR Code plugin

```typescript
import { WaciOobProps } from '@sphereon/ssi-sdk.qr-code-generator'

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

### OpenID4VCI example:

This is the credential offer

```typescript
export const credentialOffer = JSON.stringify({
  credential_issuer: 'https://credential-issuer.example.com',
  credentials: [
    'UniversityDegree_JWT',
    {
      format: 'mso_mdoc',
      doctype: 'org.iso.18013.5.1.mDL',
    },
  ],
  grants: {
    authorization_code: {
      issuer_state: 'eyJhbGciOiJSU0Et...FYUaBy',
    },
    'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
      'pre-authorized_code': 'adhjhdjajkdkhjhdj',
      user_pin_required: true,
    },
  },
})
```

It needs to be assigned to the credentialOffer field in the data scheme. The same can be
done using a reference, this will require to use the credentialOfferUri property and assign
the uri of the credential offer to it. Notice that the scheme defaults to `openid-credential-offer`
and baseUri is optional.

```typescript
const openid4vcObjectValue: OpenID4VCIDataWithScheme = {
  scheme: 'https',
  baseUri: 'test.com/credential-offer',
  credentialOffer,
}
```

Now the data scheme needs to be added to the QR code data

```typescript
const openid4vciDataValue: QRData<QRType.OpenID4VCI, OpenID4VCIDataWithScheme> = {
  object: openid4vcObjectValue,
  type: QRType.OpenID4VCI,
  id: '568',
}
```

So the QR code can be generated

```typescript
export const openid4vciCreateValue: CreateValueArgs<QRType.OpenID4VCI, OpenID4VCIDataWithScheme> = {
  data: openid4vciDataValue,
  onGenerate: (result: ValueResult<QRType.OpenID4VCI, OpenID4VCIDataWithScheme>) => {
    console.log(result, null, 2)
  },
}
```

And eventually added to an app

```typescript
export const openid4vciCreateElement: CreateElementArgs<QRType.OpenID4VCI, OpenID4VCIDataWithScheme> = {
  data: openid4vciDataValue,
  renderingProps,
  onGenerate: (result: ValueResult<QRType.OpenID4VCI, OpenID4VCIDataWithScheme>) => {
    render(<div data-testid="test-div-openid4vci">{result.data.object.credentialOffer}</div>)
    console.log(result.value)
  },
}
```
