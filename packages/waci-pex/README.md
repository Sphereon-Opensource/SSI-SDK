<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>waci-pex (Typescript) 
  <br>
</h1>

---

**Warning: This package still is in every early development. Breaking changes without notice will happen at this point!**

---

# waci-pex

A `Veramo` plugin to create an SSI QR code and to verify using `SIOPv2` or `OIDC4`. This plugin component is only supporting react and react-native frameworks.

It will be possible in future to request the issuer to issue credentials.

### Installation

```shell
yarn add @sphereon/ssi-sdk-waci-pex
```

### Build

```shell
yarn build
```

### Usage

The usage scenario will include the plugin code to be integrated in the client code. A party will be requesting the recipient to either:
  1. authenticate itself to the requester
  2. inviting the issuer to issue a credential

The data fields required to generate the QR code will depend on the type of request and the acceptable values. The possible `accept` value may be:
  1. `oidc4vp`
  2. `siop+oidc4vp`
  3. `siopv2`
  4. `didcomm/v2`  ( in future )

The data fields will need to be passed in `SsiQrCodeProps.authenticationRequestOpts.state` : string.

```
import {SsiQrCodeProvider} from "@sphereon/ssi-sdk-waci-pex";

// Include in the interface 
// const agent = createAgent<...  SsiQrCodeProvider>

export const createSsiQrCode = agent.createSsiQrCode;
```

```
import { createSsiQrCode } from '../agent';
import {QRContent, QRMode, QRType} from "@sphereon/ssi-sdk-waci-pex";

```

Inside Component
```
  qrConfig = {
    type: QRType.AUTHENTICATION,
    did: 'did:didMethod2021120900:didId2021120901',
    mode: QRMode.DID_AUTH_SIOP_V2,
    redirectUrl: 'https://example.com/qrCode/callbacks',
    onGenerate: (content: QRContent): void => {
      if (content != null) {
        console.log("received object: " + content.qrValue);

        /*
        Example output of onGenerate:
{"state":"vqKLNzmYYPDmt8YWs9ftYE","type":"auth","did":"did:ethr:0xcBe71d18b5F1259faA9fEE8f9a5FAbe2372BE8c9","mode":"didauth","redirectUrl":"https://example.com","qrValue":"{\"state\":\"vqKLNzmYYPDmt8YWs9ftYE\",\"type\":\"auth\",\"did\":\"did:ethr:0xcBe71d18b5F1259faA9fEE8f9a5FAbe2372BE8c9\",\"mode\":\"didauth\",\"redirectUrl\":\"https://example.com\"}"}
        */
      }
    },
    bgColor: 'white',
    fgColor: 'black',
    level: 'L',
    size: 128,
    title: 'title2021120903',
  };

  thisSsiQRCode = () => {
    Promise.resolve(async () => {
      console.log("called 2021122100");
      const dummyQrCode = createSsiQrCode(this.qrConfig)
        .then((qrCode: JSX.Element) => {
          console.log("called 2021122101");
          console.log('test' + qrCode.props)
          //this.setState({qrCode})
          return qrCode;
        })
      .catch(error => console.log('err' + error))
      console.log("called 2021122102");
      console.log("called 2021122103:" + dummyQrCode);

      return dummyQrCode;
    })
  }
```

```
  <View>
  //...
  {
    createSsiQrCode() ? (
      this.thisSsiQRCode()
    ) : null
  }
  </View>
```
