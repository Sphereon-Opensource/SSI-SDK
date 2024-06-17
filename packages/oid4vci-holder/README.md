<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>OpenID for Verifiable Credentials Issuance - Holder (OID4VCI)
  <br>
</h1>

---

**Warning: This package still is in very early development. Breaking changes without notice will happen at this point!**

---

## Usage

### OPENID_CREDENTIAL_OFFER SCHEMA

authorization_code

```typescript
agent.oid4vciHolderGetInitiationData({
  requestData: {
    uri: 'openid-credential-offer%3A%2F%2F%3Fcredential_offer%3D%7B%22credential_issuer%22%3A%22https%3A%2F%2Fissuer.research.identiproof.io%22%2C%22credentials%22%3A%5B%7B%22format%22%3A%22jwt_vc_json%22%2C%22types%22%3A%5B%22VerifiableCredential%22%2C%22UniversityDegreeCredential%22%5D%7D%5D%2C%22grants%22%3A%7B%22authorization_code%22%3A%7B%22issuer_state%22%3A%22eyJhbGciOiJSU0Et...FYUaBy%22%7D%7D%7D',
  },
})
```

pre-authorized_code

```typescript
agent.oid4vciHolderGetInitiationData({
  requestData: {
    uri: 'openid-credential-offer://?credential_offer%3D%7B%22credential_issuer%22%3A%22https%3A%2F%2Fissuer.research.identiproof.io%22%2C%22credentials%22%3A%5B%7B%22format%22%3A%22jwt_vc_json%22%2C%22types%22%3A%5B%22VerifiableCredential%22%2C%22UniversityDegreeCredential%22%5D%7D%5D%2C%22grants%22%3A%7B%22urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Apre-authorized_code%22%3A%7B%22pre-authorized_code%22%3A%22adhjhdjajkdkhjhdj%22%2C%22user_pin_required%22%3Atrue%7D%7D%7D',
  },
})
```

### HTTPS SCHEMA

authorization_code:

```typescript
agent.oid4vciHolderGetInitiationData({
  requestData: {
    uri: 'https://issuer.research.identiproof.io?credential_offer%3D%7B%22credential_issuer%22%3A%22https%3A%2F%2Fissuer.research.identiproof.io%22%2C%22credentials%22%3A%5B%7B%22format%22%3A%22jwt_vc_json%22%2C%22types%22%3A%5B%22VerifiableCredential%22%2C%22UniversityDegreeCredential%22%5D%7D%5D%2C%22grants%22%3A%7B%22authorization_code%22%3A%7B%22issuer_state%22%3A%22eyJhbGciOiJSU0Et...FYUaBy%22%7D%7D%7D',
  },
})
```

pre-authorized_code:

```typescript
agent.oid4vciHolderGetInitiationData({
  requestData: {
    uri: 'https://issuer.research.identiproof.io?credential_offer%3D%7B%22credential_issuer%22%3A%22https%3A%2F%2Fissuer.research.identiproof.io%22%2C%22credentials%22%3A%5B%7B%22format%22%3A%22jwt_vc_json%22%2C%22types%22%3A%5B%22VerifiableCredential%22%2C%22UniversityDegreeCredential%22%5D%7D%5D%2C%22grants%22%3A%7B%22urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Apre-authorized_code%22%3A%7B%22pre-authorized_code%22%3A%22adhjhdjajkdkhjhdj%22%2C%22user_pin_required%22%3Atrue%7D%7D%7D',
  },
})
```

## Installation

```shell
yarn add @sphereon/ssi-sdk.oid4vci-holder
```

## Build

```shell
yarn build
```
