# vc-api-issuer-plugin
A Veramo plugin to issue credentials using the vc-http-api

### Installation
```shell
yarn add @sphereon/ssi-sdk-vc-api-issuer
```

### Build
```shell
yarn build
```

### Test
To run the tests a VC_HTTP_API_AUTH_TOKEN environment variable needs to be present with an authorization token.

The test command runs:
* `prettier`
* `jest`
* `coverage`

You can also run only a single section of these tests, using for example `yarn test:unit`.
```shell
yarn test
```

### Utility scripts
There are other utility scripts that help with development.

* `yarn fix` - runs `eslint --fix` as well as `prettier` to fix code style.
