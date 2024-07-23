<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>VC API Issuer (Typescript) 
  <br>
</h1>

---

**Warning: This package still is in every early development. Breaking changes without notice will happen at this point!**

---

# attestationCredential-api-verifier

A Veramo plugin to issue credentials using the attestationCredential-http-api. Based on an older version of the spec (v0.1) and only working for Sphereon's VC API currently. We are working on supporting the latest spec version.

### Installation

```shell
yarn add @sphereon/ssi-sdk-w3c-attestationCredential-api-issuer-rest-client
```

### Build

```shell
yarn build
```

### Test

To run the tests a VC_HTTP_API_AUTH_TOKEN environment variable needs to be present with an authorization token.

The test command runs:

- `prettier`
- `jest`
- `coverage`

You can also run only a single section of these tests, using for example `yarn test:unit`.

```shell
yarn test
```

### Utility scripts

There are other utility scripts that help with development.

- `yarn fix` - runs `eslint --fix` as well as `prettier` to fix code style.
