<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>JSON-LD VC Handler Local (Typescript + React-Native) 
  <br>
</h1>

---

**Warning: This package still is in every early development. Breaking changes without notice will happen at this point!**

---

# vc-handler-ld-local

A Veramo plugin to issue and verify JSON-LD based credentials and presentations using a react-native capable port of Digital Bazaars VC library.

### Installation

```shell
yarn add @sphereon/ssi-sdk-vc-handler-ld-local
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
