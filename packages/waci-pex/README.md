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

A `Veramo` plugin to create SSI QR code and to Verify using `SIOPv2` or `OIDC4`. This plugin component is only supporting react and react-native frameworks.

It will be possible in future to request the issuer to issue credentials.

### Installation

```shell
yarn add @sphereon/waci-pex
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
