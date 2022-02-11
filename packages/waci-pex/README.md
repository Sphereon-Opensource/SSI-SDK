<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>waci-pex (Typescript) 
  <br>
</h1>

---

**Warning: This package still is in very early development. Breaking changes without notice will happen at this point!**

---

# waci-pex

A `Sphereon SSI-SDK` plugin to create an SSI QR code and to verify using `SIOPv2` or `OIDC4`. This plugin component is only supporting react and react-native frameworks.

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
4. `didcomm/v2` ( in future )

The data fields will need to be passed in `SsiQrCodeProps.authenticationRequestOpts.state` : string.

#### Importing the plugin

```
import {SsiQrCodeProvider} from "@sphereon/ssi-sdk-waci-pex";

// Include in the interface
// const agent = createAgent<...  SsiQrCodeProvider>
```

#### Adding plugin to the agent

```
plugins: [
  ...
  new SsiQrCodeProvider()
],
```

#### Export for the function

```
export const createSsiQrCode = agent.ssiQrCode;
```

The function declared in agent can be imported for usage like below:

```
import { createSsiQrCode } from '../agent';
import {QRContent, QRMode, QRType} from "@sphereon/ssi-sdk-waci-pex";

```

#### Inside the component we can declare or get the values to pass to QR Code plugin

```
    getSsiQrCodeProps(): SsiQrCodeProps {
    return {
      accept: AcceptValue.OIDC4VP,
      mode: QRMode.DID_AUTH_SIOP_V2,
      authenticationRequestOpts: {
        redirectUri: 'https://example.com/qrCode/callbacks',
        requestBy: {
          type: SIOP.PassBy.VALUE
        },
        signatureType: {
          hexPrivateKey: "e96d4bf41709c1bf9276ed784b39d6f6ae47e7e4091f849e5ab001452340acf7",
          did: "did:ethr:0x93e73FACcc011a8209B35d8c7950670B1a7bd902",
          kid: "did:ethr:0x93e73FACcc011a8209B35d8c7950670B1a7bd902#controller",
        },
        registration: {
          didMethodsSupported: ['did:ethr:'],
          subjectIdentifiersSupported: SubjectIdentifierType.DID,
          credentialFormatsSupported: [CredentialFormat.JWT],
          registrationBy: {
            type: SIOP.PassBy.VALUE,
          },
        },
        state: "State 2022-01-31 00"
      },
      onGenerate: (content: QRContent) => {
        // Example output of onGenerate:
        // {
        //   "nonce": "gMWABjAANoQ3LfScAF4HPW",
        //   "state": "State 2022-01-31 00",
        //   "qrValue": "openid://?response_type=id_token&scope=openid&client_id=did%3Aethr%3A0x93e73FACcc011a8209B35d8c7950670B1a7bd902&redirect_uri=https%3A%2F%2Fexample.com%2FqrCode%2Fcallbacks&iss=did%3Aethr%3A0x93e73FACcc011a8209B35d8c7950670B1a7bd902&response_mode=post&response_context=rp&nonce=rSwJ_-N_EUO-X7HX3dVAsKe2_jjrxlIMmZakKiTjDdY&state=State%202022-01-31%2000&registration=%7B%22did_methods_supported%22%3A%5B%22did%3Aethr%3A%22%5D%2C%22subject_identifiers_supported%22%3A%22did%22%2C%22credential_formats_supported%22%3A%5B%22jwt%22%5D%7D&request=eyJhbGciOiJFUzI1NksiLCJraWQiOiJkaWQ6ZXRocjoweDkzZTczRkFDY2MwMTFhODIwOUIzNWQ4Yzc5NTA2NzBCMWE3YmQ5MDIjY29udHJvbGxlciIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NDQ1MDUyODQsImV4cCI6MTY0NDUwNTg4NCwicmVzcG9uc2VfdHlwZSI6ImlkX3Rva2VuIiwic2NvcGUiOiJvcGVuaWQiLCJjbGllbnRfaWQiOiJkaWQ6ZXRocjoweDkzZTczRkFDY2MwMTFhODIwOUIzNWQ4Yzc5NTA2NzBCMWE3YmQ5MDIiLCJyZWRpcmVjdF91cmkiOiJodHRwczovL2V4YW1wbGUuY29tL3FyQ29kZS9jYWxsYmFja3MiLCJpc3MiOiJkaWQ6ZXRocjoweDkzZTczRkFDY2MwMTFhODIwOUIzNWQ4Yzc5NTA2NzBCMWE3YmQ5MDIiLCJyZXNwb25zZV9tb2RlIjoicG9zdCIsInJlc3BvbnNlX2NvbnRleHQiOiJycCIsIm5vbmNlIjoiclN3Sl8tTl9FVU8tWDdIWDNkVkFzS2UyX2pqcnhsSU1tWmFrS2lUakRkWSIsInN0YXRlIjoiU3RhdGUgMjAyMi0wMS0zMSAwMCIsInJlZ2lzdHJhdGlvbiI6eyJkaWRfbWV0aG9kc19zdXBwb3J0ZWQiOlsiZGlkOmV0aHI6Il0sInN1YmplY3RfaWRlbnRpZmllcnNfc3VwcG9ydGVkIjoiZGlkIiwiY3JlZGVudGlhbF9mb3JtYXRzX3N1cHBvcnRlZCI6WyJqd3QiXX19.Sld1kZvV5NNL592MT16ssVVmNif4MhkxUtsRZcHxxUXWXgae4ilbgK1O_pY1ISi-dtQXES0Lp8pzkVj2w47sPA"
        // }
      },
      bgColor: 'white',
      fgColor: 'black',
      level: 'L',
      size: 128,
      title: 'title2021120903',
    }
  }

  delegateCreateSsiQRCode = () => {
    let qrCode = createSsiQrCode(this.getSsiQrCodeProps())
    return qrCode
    .then(qrCodeResolved => {
      return qrCodeResolved
    });
  }
```

#### For rendering add to the view

```
  <View>
  //...
  {
    this.delegateCreateSsiQRCode()
  }
  </View>
```
